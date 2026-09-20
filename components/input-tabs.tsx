'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, Upload, Camera } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DrawCanvas, type DrawCanvasHandle } from '@/components/draw-canvas';
import { UploadMode, type UploadModeHandle } from '@/components/upload-mode';
import { CameraMode, type CameraModeHandle } from '@/components/camera-mode';
import type { InputMode } from '@/lib/types';

interface InputTabsProps {
  mode: InputMode;
  onModeChange: (mode: InputMode) => void;
  disabled?: boolean;
}

export interface InputTabsHandle {
  getDataUrl: () => string | null;
}

const InputTabs = React.forwardRef<InputTabsHandle, InputTabsProps>(
  ({ mode, onModeChange, disabled }, forwardedRef) => {
    const drawRef = React.useRef<DrawCanvasHandle>(null);
    const uploadRef = React.useRef<UploadModeHandle>(null);
    const cameraRef = React.useRef<CameraModeHandle>(null);

    React.useImperativeHandle(forwardedRef, () => ({
      getDataUrl: () => {
        if (mode === 'draw') return drawRef.current?.capture() ?? null;
        if (mode === 'upload') return uploadRef.current?.getDataUrl() ?? null;
        if (mode === 'camera') return cameraRef.current?.getDataUrl() ?? null;
        return null;
      },
    }));

    const tabConfig = [
      {
        value: 'draw' as const,
        label: 'Draw',
        icon: Pencil,
        description: 'Sketch characters directly',
      },
      {
        value: 'upload' as const,
        label: 'Upload',
        icon: Upload,
        description: 'Upload a handwritten image',
      },
      {
        value: 'camera' as const,
        label: 'Camera',
        icon: Camera,
        description: 'Capture with live camera',
      },
    ];

    return (
      <div className="flex flex-col h-full">
        <Tabs
          value={mode}
          onValueChange={(v) => onModeChange(v as InputMode)}
          className="flex flex-col h-full"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto p-1.5 rounded-2xl glass">
            {tabConfig.map((tab) => {
              const Icon = tab.icon;
              const isActive = mode === tab.value;
              return (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="relative flex flex-col items-center gap-1 py-3 rounded-xl transition-all data-[state=active]:bg-gradient-brand data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="tab-glow"
                      className="absolute inset-0 rounded-xl bg-gradient-brand opacity-10 -z-10"
                    />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <div className="flex-1 mt-4 min-h-[400px]">
            <TabsContent value="draw" className="mt-0 h-full">
              <DrawCanvas ref={drawRef} disabled={disabled} />
            </TabsContent>
            <TabsContent value="upload" className="mt-0 h-full">
              <UploadMode ref={uploadRef} disabled={disabled} />
            </TabsContent>
            <TabsContent value="camera" className="mt-0 h-full">
              <CameraMode ref={cameraRef} disabled={disabled} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    );
  }
);

InputTabs.displayName = 'InputTabs';
export { InputTabs };
