'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, History, PenTool, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderBannerProps {
  onOpenHistory: () => void;
  historyCount: number;
}

export function HeaderBanner({ onOpenHistory, historyCount }: HeaderBannerProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="glass-strong border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-brand rounded-xl blur-lg opacity-40" />
              <div className="relative w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-glow">
                <PenTool className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-bold leading-tight">
                <span className="text-gradient">NeuralScript</span> AI
              </h1>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Multilingual Handwriting Recognition
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="flex-1 flex justify-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full glass"
            >
              <div className="relative flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="absolute w-2 h-2 rounded-full bg-green-500 animate-ping opacity-75" />
              </div>
              <span className="text-xs font-medium text-foreground whitespace-nowrap">
                AI Neural Vision: Online
              </span>
              <Sparkles className="h-3 w-3 text-primary" />
            </motion.div>
          </div>

          {/* Actions */}
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onOpenHistory}
                    className="relative rounded-xl h-10 w-10"
                  >
                    <History className="h-5 w-5" />
                    {historyCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-brand text-white text-[10px] font-bold flex items-center justify-center">
                        {historyCount > 99 ? '99+' : historyCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>History ({historyCount})</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="rounded-xl h-10 w-10"
                  >
                    {mounted ? (
                      theme === 'dark' ? (
                        <Sun className="h-5 w-5" />
                      ) : (
                        <Moon className="h-5 w-5" />
                      )
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Toggle theme</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>
      </div>
    </motion.header>
  );
}
