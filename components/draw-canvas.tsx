'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Brush,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Contrast,
  Maximize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

export interface DrawCanvasHandle {
  capture: () => string | null;
  hasContent: () => boolean;
}

interface DrawCanvasProps {
  disabled?: boolean;
}

const BG_LIGHT = '#ffffff';
const INK_LIGHT = '#1e1b2e';
const INK_DARK = '#f8fafc';
const DARK_BG = '#0f0a1e';

const DrawCanvas = React.forwardRef<DrawCanvasHandle, DrawCanvasProps>(
  ({ disabled }, forwardedRef) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const strokesRef = React.useRef<Stroke[]>([]);
    const redoStackRef = React.useRef<Stroke[]>([]);
    const currentStrokeRef = React.useRef<Stroke | null>(null);
    const isDrawingRef = React.useRef(false);
    const [brushWidth, setBrushWidth] = React.useState(6);
    const [inverted, setInverted] = React.useState(false);
    const [isEraser, setIsEraser] = React.useState(false);
    const [canUndo, setCanUndo] = React.useState(false);
    const [canRedo, setCanRedo] = React.useState(false);
    const [hasContent, setHasContent] = React.useState(false);
    const [isDark, setIsDark] = React.useState(false);

    React.useEffect(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });
      return () => observer.disconnect();
    }, []);

    const bgColor = inverted ? (isDark ? INK_DARK : INK_LIGHT) : isDark ? DARK_BG : BG_LIGHT;
    const inkColor = isEraser
      ? bgColor
      : inverted
        ? isDark ? DARK_BG : BG_LIGHT
        : isDark ? INK_DARK : INK_LIGHT;

    const drawStroke = (ctx: CanvasRenderingContext2D, stroke: Stroke) => {
      const pts = stroke.points;
      if (pts.length === 0) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      if (pts.length === 1) {
        ctx.beginPath();
        ctx.arc(pts[0]!.x, pts[0]!.y, stroke.width / 2, 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(pts[0]!.x, pts[0]!.y);
      for (let i = 1; i < pts.length - 1; i++) {
        const midX = (pts[i]!.x + pts[i + 1]!.x) / 2;
        const midY = (pts[i]!.y + pts[i + 1]!.y) / 2;
        ctx.quadraticCurveTo(pts[i]!.x, pts[i]!.y, midX, midY);
      }
      const last = pts[pts.length - 1]!;
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    };

    const redrawAll = React.useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const rect = container.getBoundingClientRect();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke);
      }
    }, [bgColor]);

    const setupCanvas = React.useCallback(() => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(dpr, dpr);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      redrawAll();
    }, [redrawAll]);

    React.useEffect(() => {
      setupCanvas();
    }, [setupCanvas]);

    React.useEffect(() => {
      const handleResize = () => setupCanvas();
      window.addEventListener('resize', handleResize);
      const handleFsChange = () => setTimeout(setupCanvas, 100);
      document.addEventListener('fullscreenchange', handleFsChange);
      return () => {
        window.removeEventListener('resize', handleResize);
        document.removeEventListener('fullscreenchange', handleFsChange);
      };
    }, [setupCanvas]);

    React.useEffect(() => {
      redrawAll();
    }, [redrawAll]);

    React.useImperativeHandle(forwardedRef, () => ({
      capture: () => {
        const canvas = canvasRef.current;
        if (!canvas || strokesRef.current.length === 0) return null;
        return canvas.toDataURL('image/png');
      },
      hasContent: () => strokesRef.current.length > 0,
    }));

    const getPos = (e: React.PointerEvent): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const handlePointerDown = (e: React.PointerEvent) => {
      if (disabled) return;
      e.preventDefault();
      canvasRef.current?.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      currentStrokeRef.current = { points: [getPos(e)], color: inkColor, width: brushWidth };
      redoStackRef.current = [];
      setCanRedo(false);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDrawingRef.current || disabled) return;
      const stroke = currentStrokeRef.current;
      if (!stroke) return;
      stroke.points.push(getPos(e));
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      const pts = stroke.points;
      if (pts.length < 3) return;
      const len = pts.length;
      const p0 = pts[len - 3]!;
      const p1 = pts[len - 2]!;
      const p2 = pts[len - 1]!;
      const midX1 = (p0.x + p1.x) / 2;
      const midY1 = (p0.y + p1.y) / 2;
      const midX2 = (p1.x + p2.x) / 2;
      const midY2 = (p1.y + p2.y) / 2;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(midX1, midY1);
      ctx.quadraticCurveTo(p1.x, p1.y, midX2, midY2);
      ctx.stroke();
    };

    const handlePointerUp = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      const stroke = currentStrokeRef.current;
      if (stroke && stroke.points.length > 0) {
        strokesRef.current.push(stroke);
        setCanUndo(true);
        setHasContent(true);
      }
      currentStrokeRef.current = null;
    };

    const undo = () => {
      if (strokesRef.current.length === 0) return;
      redoStackRef.current.push(strokesRef.current.pop()!);
      setCanUndo(strokesRef.current.length > 0);
      setCanRedo(true);
      setHasContent(strokesRef.current.length > 0);
      redrawAll();
    };

    const redo = () => {
      if (redoStackRef.current.length === 0) return;
      strokesRef.current.push(redoStackRef.current.pop()!);
      setCanUndo(true);
      setCanRedo(redoStackRef.current.length > 0);
      setHasContent(true);
      redrawAll();
    };

    const clear = () => {
      strokesRef.current = [];
      redoStackRef.current = [];
      setCanUndo(false);
      setCanRedo(false);
      setHasContent(false);
      redrawAll();
    };

    const toggleFullscreen = () => {
      const container = containerRef.current;
      if (!container) return;
      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    };

    return (
      <div className="flex flex-col gap-4 h-full">
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-3 glass rounded-2xl p-3">
            <div className="flex items-center gap-2 min-w-[140px] flex-1">
              <Brush className="h-4 w-4 text-primary shrink-0" />
              <Slider
                value={[brushWidth]}
                onValueChange={(v) => setBrushWidth(v[0] ?? 6)}
                min={1}
                max={30}
                step={1}
                className="flex-1"
              />
              <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                {brushWidth}px
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={isEraser ? 'default' : 'ghost'} size="icon" onClick={() => setIsEraser(!isEraser)} className="h-9 w-9 rounded-xl">
                    <Eraser className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Eraser</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant={inverted ? 'default' : 'ghost'} size="icon" onClick={() => setInverted(!inverted)} className="h-9 w-9 rounded-xl">
                    <Contrast className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Invert ink</TooltipContent>
              </Tooltip>
              <div className="w-px h-6 bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo} className="h-9 w-9 rounded-xl">
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Undo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo} className="h-9 w-9 rounded-xl">
                    <Redo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Redo</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={clear} disabled={!hasContent} className="h-9 w-9 rounded-xl text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear canvas</TooltipContent>
              </Tooltip>
              <div className="w-px h-6 bg-border mx-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="h-9 w-9 rounded-xl">
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Fullscreen</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative flex-1 min-h-[300px] rounded-2xl overflow-hidden shadow-glow"
          style={{
            background: bgColor,
            backgroundImage:
              isDark && !inverted
                ? 'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.08), transparent 50%)'
                : undefined,
          }}
        >
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            className="absolute inset-0 touch-none cursor-crosshair"
            style={{ touchAction: 'none' }}
          />
          {!hasContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Brush className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
                <p className="text-muted-foreground/50 text-sm">
                  Draw a character, conjunct, word, or sentence here
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    );
  }
);

DrawCanvas.displayName = 'DrawCanvas';
export { DrawCanvas };
