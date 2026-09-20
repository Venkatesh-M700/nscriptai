'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  RefreshCw,
  Aperture,
  Grid3x3,
  X,
  AlertCircle,
  PowerOff,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

interface CameraModeProps {
  disabled?: boolean;
}

export interface CameraModeHandle {
  getDataUrl: () => string | null;
  reset: () => void;
}

const CameraMode = React.forwardRef<CameraModeHandle, CameraModeProps>(
  ({ disabled }, forwardedRef) => {
    const videoRef = React.useRef<HTMLVideoElement | null>(null);
    const streamRef = React.useRef<MediaStream | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const [stream, setStream] = React.useState<MediaStream | null>(null);
    const [showPermissionDialog, setShowPermissionDialog] = React.useState(false);
    const [capturedImage, setCapturedImage] = React.useState<string | null>(null);
    const [showGrid, setShowGrid] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // ಕ್ಯಾಮೆರಾ ಆಫ್ ಮಾಡುವ ಫಂಕ್ಷನ್
    const stopStream = React.useCallback(() => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      setStream(null);
    }, []);

    React.useImperativeHandle(forwardedRef, () => ({
      getDataUrl: () => capturedImage,
      reset: () => {
        setCapturedImage(null);
        stopStream();
      },
    }));

    React.useEffect(() => {
      return () => {
        stopStream();
      };
    }, [stopStream]);

    // ವಿಡಿಯೋ ಎಲಿಮೆಂಟ್ ಲಿಂಕ್ ಮಾಡುವುದು
    const videoCallback = React.useCallback(
      (node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && stream) {
          node.srcObject = stream;
          node.onloadedmetadata = () => {
            node.play().catch((err) => console.error('Play error:', err));
          };
          node.play().catch(() => {});
        }
      },
      [stream]
    );

    // ಮೊಬೈಲ್ ಮತ್ತು ಲ್ಯಾಪ್‌ಟಾಪ್ ಎರಡಕ್ಕೂ ಹೊಂದುವ ಸ್ಟ್ರೀಮ್ ಆರಂಭ
    const startStream = async () => {
      setError(null);
      stopStream();

      // ಮೊಬೈಲ್ ಬ್ರೌಸರ್‌ಗಳಿಗೆ MediaDevices ಚೆಕ್
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setError('Camera API is not supported in this browser. Please open in Google Chrome app.');
        return;
      }

      try {
        let mediaStream: MediaStream;

        // 1. ಮೊದಲಿಗೆ ಮೊಬೈಲ್‌ನ ಹಿಂಬದಿಯ ಕ್ಯಾಮೆರಾ (environment) ಪ್ರಯತ್ನಿಸುವುದು
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: 'environment' },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch {
          // 2. ಲ್ಯಾಪ್‌ಟಾಪ್ ವೆಬ್‌ಕ್ಯಾಮ್ ಅಥವಾ ಸಾಮಾನ್ಯ ಕ್ಯಾಮೆರಾ ಫಾಲ್‌ಬ್ಯಾಕ್
          mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to access camera';
        if (msg.includes('Permission') || msg.includes('denied') || msg.includes('NotAllowed')) {
          setError('Camera permission was blocked. Please tap the 3 dots in the top corner and click "Open in Chrome".');
        } else if (msg.includes('NotFound') || msg.includes('Devices')) {
          setError('No camera device found.');
        } else {
          setError(`Camera error: ${msg}`);
        }
        stopStream();
      }
    };

    const handleEnableCamera = () => {
      setShowPermissionDialog(true);
    };

    const confirmEnable = () => {
      // ಪಾಪ್-ಅಪ್ ಅನ್ನು ಮೊದಲೇ ಮುಚ್ಚಬೇಕು, ಆಗ ಮಾತ್ರ ಬ್ರೌಸರ್ ಪರ್ಮಿಷನ್ ಪಾಪ್-ಅಪ್ ಮುಂದೆ ಬರುತ್ತದೆ!
      setShowPermissionDialog(false);
      startStream();
    };

    // ನೇರ ಫೋಟೋ ಕ್ಯಾಪ್ಚರ್
    const capture = () => {
      const video = videoRef.current;
      if (!video || !streamRef.current) return;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImage(dataUrl);
      stopStream();
    };

    const retake = () => {
      setCapturedImage(null);
      startStream();
    };

    // ಮೊಬೈಲ್ ನೇರ ಕ್ಯಾಮೆರಾ ಫಾಲ್‌ಬ್ಯಾಕ್ (In-App ಬ್ರೌಸರ್‌ನಲ್ಲೂ 100% ಕೆಲಸ ಮಾಡುತ್ತದೆ)
    const handleNativeMobileCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setCapturedImage(event.target?.result as string);
          stopStream();
        };
        reader.readAsDataURL(file);
      }
    };

    return (
      <div className="flex flex-col gap-4 h-full">
        {/* ಹಿಡನ್ ಮೊಬೈಲ್ ಕ್ಯಾಮೆರಾ ಇನ್‌ಪುಟ್ */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleNativeMobileCapture}
          className="hidden"
        />

        <AnimatePresence mode="wait">
          {capturedImage ? (
            <motion.div
              key="captured"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 flex-1"
            >
              <div className="relative flex-1 min-h-[260px] rounded-2xl overflow-hidden glass flex items-center justify-center">
                <img src={capturedImage} alt="Captured" className="max-w-full max-h-full object-contain" />
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={retake}
                  title="Retake photo"
                  className="absolute top-3 right-3 h-8 w-8 rounded-lg z-10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Aperture className="h-4 w-4 text-primary" />
                <span>Snapshot captured — camera turned off. Click Recognize below.</span>
              </div>
            </motion.div>
          ) : !stream ? (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center gap-6 min-h-[300px] rounded-2xl border-2 border-dashed border-border"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-brand rounded-2xl blur-xl opacity-20" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="text-center px-6">
                <p className="text-lg font-semibold">Live Camera Capture</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                  Click the button below to turn on the camera. It automatically turns off when you switch tabs.
                </p>
              </div>

              {error && (
                <div className="flex flex-col items-center gap-2 max-w-sm p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button
                  onClick={handleEnableCamera}
                  disabled={disabled}
                  size="lg"
                  className="rounded-xl bg-gradient-brand text-white hover:opacity-90 shadow-glow"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Enable Live Camera
                </Button>

                {/* ಮೊಬೈಲ್ ಕ್ಯಾಮೆರಾ ನೇರ ಬಟನ್ (ಯಾವುದೇ ಬ್ರೌಸರ್ ಬ್ಲಾಕ್ ತೊಂದರೆ ಇರುವುದಿಲ್ಲ) */}
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border-primary/40 hover:bg-primary/10"
                >
                  <Smartphone className="h-5 w-5 mr-2 text-primary" />
                  Open Phone Camera
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="live"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 flex-1"
            >
              <div className="relative flex-1 min-h-[320px] rounded-2xl overflow-hidden bg-neutral-950 shadow-glow flex items-center justify-center">
                <video
                  ref={videoCallback}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-contain"
                />
                {showGrid && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-white/15" />
                      ))}
                    </div>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs text-white font-medium">LIVE</span>
                </div>

                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopStream}
                  className="absolute top-3 right-3 rounded-xl gap-1.5 shadow-md"
                >
                  <PowerOff className="h-3.5 w-3.5" />
                  <span className="text-xs">Turn Off</span>
                </Button>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button variant="outline" size="icon" onClick={() => setShowGrid(!showGrid)} className="rounded-xl h-12 w-12">
                  <Grid3x3 className="h-5 w-5" />
                </Button>
                <Button
                  onClick={capture}
                  size="lg"
                  title="Capture snapshot"
                  className="rounded-full h-16 w-16 p-0 bg-gradient-brand text-white hover:opacity-90 shadow-glow"
                >
                  <Aperture className="h-7 w-7" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => startStream()} title="Restart Camera" className="rounded-xl h-12 w-12">
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
          <DialogContent className="glass-strong rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                Enable Camera Access
              </DialogTitle>
              <DialogDescription>
                Allow access to your camera to capture handwritten documents. It turns off automatically when you exit this mode.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowPermissionDialog(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={confirmEnable} className="rounded-xl bg-gradient-brand text-white hover:opacity-90">
                Allow &amp; Enable
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

CameraMode.displayName = 'CameraMode';
export { CameraMode };
