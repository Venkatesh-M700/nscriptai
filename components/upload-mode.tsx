'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  ImageIcon,
  RotateCw,
  RotateCcw,
  Sun,
  Contrast,
  X,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface UploadModeProps {
  onImageReady?: (dataUrl: string) => void;
  disabled?: boolean;
}

export interface UploadModeHandle {
  getDataUrl: () => string | null;
  reset: () => void;
}

const UploadMode = React.forwardRef<UploadModeHandle, UploadModeProps>(
  ({ disabled }, forwardedRef) => {
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const imageRef = React.useRef<HTMLImageElement | null>(null);
    const [dataUrl, setDataUrl] = React.useState<string | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [brightness, setBrightness] = React.useState(100);
    const [contrast, setContrast] = React.useState(100);
    const [rotation, setRotation] = React.useState(0);
    const [showEnhancer, setShowEnhancer] = React.useState(false);

    React.useImperativeHandle(forwardedRef, () => ({
      getDataUrl: () => {
        if (!dataUrl) return null;
        renderToCanvas();
        const canvas = canvasRef.current;
        return canvas ? canvas.toDataURL('image/png') : dataUrl;
      },
      reset: () => {
        setDataUrl(null);
        setBrightness(100);
        setContrast(100);
        setRotation(0);
        setShowEnhancer(false);
      },
    }));

    const handleFile = (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          imageRef.current = img;
          setDataUrl(url);
          setShowEnhancer(true);
        };
        img.src = url;
      };
      reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    };

    const renderToCanvas = () => {
      const canvas = canvasRef.current;
      const img = imageRef.current;
      if (!canvas || !img) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const maxDim = 1024;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        const ratio = Math.min(maxDim / w, maxDim / h);
        w = w * ratio;
        h = h * ratio;
      }

      // Account for rotation
      const isRotated = rotation % 180 !== 0;
      canvas.width = isRotated ? h : w;
      canvas.height = isRotated ? w : h;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();
      ctx.filter = 'none';
    };

    React.useEffect(() => {
      if (dataUrl) renderToCanvas();
    }, [dataUrl, brightness, contrast, rotation]);

    const rotate = (dir: 'cw' | 'ccw') => {
      setRotation((r) => (dir === 'cw' ? (r + 90) % 360 : (r - 90 + 360) % 360));
    };

    const removeImage = () => {
      setDataUrl(null);
      imageRef.current = null;
      setBrightness(100);
      setContrast(100);
      setRotation(0);
      setShowEnhancer(false);
    };

    return (
      <div className="flex flex-col gap-4 h-full">
        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence mode="wait">
          {!dataUrl ? (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center"
            >
              <label
                onDragOver={(e) => {
                  e.preventDefault();
                  if (!disabled) setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`group relative flex flex-col items-center justify-center w-full h-full min-h-[300px] rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? 'border-primary bg-primary/10 scale-[1.01]'
                    : 'border-border hover:border-primary/50 hover:bg-primary/5'
                } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <motion.div
                  animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
                  className="flex flex-col items-center gap-4 p-8"
                >
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-brand rounded-2xl blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
                      <Upload className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">
                      Drop your handwritten image here
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse — PNG, JPG, WEBP supported
                    </p>
                  </div>
                </motion.div>
              </label>
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 flex-1"
            >
              <div className="relative flex-1 min-h-[250px] rounded-2xl overflow-hidden glass flex items-center justify-center">
                <img
                  src={dataUrl}
                  alt="Uploaded preview"
                  className="max-w-full max-h-full object-contain"
                  style={{
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    transform: `rotate(${rotation}deg)`,
                  }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={removeImage}
                  className="absolute top-3 right-3 h-8 w-8 rounded-lg z-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <AnimatePresence>
                {showEnhancer && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="glass rounded-2xl p-4 overflow-hidden"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sliders className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Image Enhancer</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Sun className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                          value={[brightness]}
                          onValueChange={(v) => setBrightness(v[0] ?? 100)}
                          min={50}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                          {brightness}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Contrast className="h-4 w-4 text-muted-foreground shrink-0" />
                        <Slider
                          value={[contrast]}
                          onValueChange={(v) => setContrast(v[0] ?? 100)}
                          min={50}
                          max={200}
                          step={1}
                          className="flex-1"
                        />
                        <span className="text-xs tabular-nums text-muted-foreground w-10 text-right">
                          {contrast}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Button variant="outline" size="sm" onClick={() => rotate('ccw')} className="rounded-xl">
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Rotate Left
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => rotate('cw')} className="rounded-xl">
                        <RotateCw className="h-4 w-4 mr-2" />
                        Rotate Right
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setBrightness(100);
                          setContrast(100);
                          setRotation(0);
                        }}
                        className="rounded-xl ml-auto"
                      >
                        Reset
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {!dataUrl && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>Handwritten document photos work best with good lighting</span>
          </div>
        )}
      </div>
    );
  }
);

UploadMode.displayName = 'UploadMode';
export { UploadMode };
