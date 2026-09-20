'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import {
  Globe,
  Key,
  Settings,
  Info,
  ChevronRight,
  ShieldCheck,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LANGUAGES } from '@/lib/languages';
import type { LanguageCode } from '@/lib/types';

interface ApiKeyStatus {
  configured: boolean;
  source: 'database' | 'env' | 'none';
  maskedKey: string | null;
}

interface SidebarSettingsProps {
  language: LanguageCode;
  onLanguageChange: (lang: LanguageCode) => void;
  customLanguage: string;
  onCustomLanguageChange: (val: string) => void;
}

export function SidebarSettings({
  language,
  onLanguageChange,
  customLanguage,
  onCustomLanguageChange,
}: SidebarSettingsProps) {
  const [showKeyDrawer, setShowKeyDrawer] = React.useState(false);
  const [keyStatus, setKeyStatus] = React.useState<ApiKeyStatus>({
    configured: false,
    source: 'none',
    maskedKey: null,
  });

  const fetchKeyStatus = React.useCallback(async () => {
    try {
      const res = await fetch('/api/settings/api-key');
      if (res.ok) {
        const data = await res.json();
        setKeyStatus(data);
      }
    } catch {
      // retry on drawer open
    }
  }, []);

  React.useEffect(() => {
    fetchKeyStatus();
  }, [fetchKeyStatus]);

  const openDrawer = () => {
    fetchKeyStatus();
    setShowKeyDrawer(true);
  };

  const currentLang = LANGUAGES.find((l) => l.code === language);

  const statusBadge = () => {
    if (!keyStatus.configured) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Not configured</span>
        </div>
      );
    }
    const isDb = keyStatus.source === 'database';
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green-500/10 text-green-600 dark:text-green-500 text-sm">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span>
          {isDb ? 'Configured in Database' : 'Configured via Environment'}
        </span>
      </div>
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col gap-5 glass rounded-2xl p-5"
      >
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <Settings className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Recognition Settings</h3>
        </div>

        {/* Language selector */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Target Language</Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-[240px]">
                <p>Select the script of the handwritten text. Auto-Detect works for clear handwriting.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <Select value={language} onValueChange={(v) => onLanguageChange(v as LanguageCode)}>
            <SelectTrigger className="rounded-xl glass">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-[320px]">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{lang.nativeLabel}</span>
                    <span className="text-muted-foreground">— {lang.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {language === 'other' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Input
                placeholder="Enter custom language/script name"
                value={customLanguage}
                onChange={(e) => onCustomLanguageChange(e.target.value)}
                className="rounded-xl mt-2"
              />
            </motion.div>
          )}

          {currentLang && currentLang.code !== 'other' && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/60" />
              <span>{currentLang.script} script — {currentLang.unicodeHint}</span>
            </div>
          )}
        </div>

        {/* API Key Status Panel */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Gemini API Key</Label>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge()}
            <Button
              variant="outline"
              size="sm"
              onClick={openDrawer}
              className="rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {keyStatus.configured && keyStatus.maskedKey && (
            <p className="text-xs text-muted-foreground font-mono">
              {keyStatus.maskedKey}
            </p>
          )}
          {!keyStatus.configured && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              API key not configured on server.
            </p>
          )}
        </div>
      </motion.div>

      {/* API Key Modal Drawer (Read-Only Secure View) */}
      <Sheet open={showKeyDrawer} onOpenChange={setShowKeyDrawer}>
        <SheetContent side="right" className="glass-strong rounded-l-2xl w-full sm:max-w-md flex flex-col justify-between">
          <div>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Secure Database API Configuration
              </SheetTitle>
              <SheetDescription>
                The API key is securely stored in the database and executed exclusively server-side.
                The actual key is never exposed to the browser.
              </SheetDescription>
            </SheetHeader>

            <div className="flex flex-col gap-4 mt-6">
              {/* Current status display */}
              <div className="flex items-center gap-3 p-4 rounded-xl glass border border-border/50 shadow-sm">
                <div
                  className={`w-3 h-3 rounded-full ${
                    keyStatus.configured ? 'bg-green-500 animate-pulse' : 'bg-amber-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    {keyStatus.configured
                      ? 'Configured & Connected in Database'
                      : 'No API key configured'}
                  </p>
                  {keyStatus.maskedKey && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {keyStatus.maskedKey}
                    </p>
                  )}
                </div>
                {keyStatus.source === 'database' && (
                  <Database className="h-4 w-4 text-primary shrink-0" />
                )}
              </div>
            </div>
          </div>

          {/* Clean Close Button Only */}
          <SheetFooter className="mt-8">
            <Button
              variant="outline"
              onClick={() => setShowKeyDrawer(false)}
              className="w-full rounded-xl"
            >
              Close
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </TooltipProvider>
  );
}
