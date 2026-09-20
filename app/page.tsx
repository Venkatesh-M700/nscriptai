'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderBanner } from '@/components/header-banner';
import { InputTabs, type InputTabsHandle } from '@/components/input-tabs';
import { SidebarSettings } from '@/components/sidebar-settings';
import { OutputPanel } from '@/components/output-panel';
import { HistoryDrawer } from '@/components/history-drawer';
import { useToast } from '@/hooks/use-toast';
import { LANGUAGES, getLanguageLabel } from '@/lib/languages';
import { isSingleCharacter, classifyCharacter } from '@/lib/character-insight';
import { loadHistory, saveHistory, addHistoryItem, clearHistory } from '@/lib/history';
import type { InputMode, LanguageCode, RecognitionResult, HistoryItem } from '@/lib/types';

export default function Home() {
  const { toast } = useToast();
  const inputTabsRef = React.useRef<InputTabsHandle>(null);

  const [mode, setMode] = React.useState<InputMode>('draw');
  const [language, setLanguage] = React.useState<LanguageCode>('auto');
  const [customLanguage, setCustomLanguage] = React.useState('');

  const [result, setResult] = React.useState<RecognitionResult | null>(null);
  const [sourceImage, setSourceImage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [historyItems, setHistoryItems] = React.useState<HistoryItem[]>([]);

  // Load persisted state
  React.useEffect(() => {
    setHistoryItems(loadHistory());
  }, []);

  const persistHistory = React.useCallback((items: HistoryItem[]) => {
    setHistoryItems(items);
    saveHistory(items);
  }, []);

  const handleRecognize = async () => {
    setError(null);

    const dataUrl = inputTabsRef.current?.getDataUrl();
    if (!dataUrl) {
      toast({
        title: 'No input to recognize',
        description:
          mode === 'draw'
            ? 'Draw something on the canvas first.'
            : mode === 'upload'
              ? 'Upload an image first.'
              : 'Capture a photo first.',
        variant: 'destructive',
      });
      return;
    }

    setSourceImage(dataUrl);
    setIsProcessing(true);
    setResult(null);

    try {
      const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: 'image/png',
          language,
          customLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Recognition failed. Please try again.');
        setIsProcessing(false);
        return;
      }

      const recognizedText: string = data.text || '';
      const langLabel = getLanguageLabel(language, customLanguage);
      const single = data.isSingleCharacter || isSingleCharacter(recognizedText);
      const insight = single
        ? classifyCharacter(recognizedText, language, customLanguage)
        : undefined;

      const recognitionResult: RecognitionResult = {
        text: recognizedText,
        language: langLabel,
        isSingleCharacter: single,
        characterInsight: insight,
      };

      setResult(recognitionResult);
      setIsProcessing(false);

      // Save to history
      const newItem = addHistoryItem({
        thumbnail: dataUrl,
        recognizedText,
        language,
        languageLabel: langLabel,
        mode,
        isSingleCharacter: single,
        characterInsight: insight,
      });
      persistHistory([newItem, ...historyItems]);

      toast({
        title: 'Recognition complete',
        description: single ? 'Single character detected' : 'Text transcribed successfully',
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error occurred';
      setError(`Recognition failed: ${msg}. Please check your connection and try again.`);
      setIsProcessing(false);
    }
  };

  const handleDeleteHistory = (id: string) => {
    persistHistory(historyItems.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    clearHistory();
    setHistoryItems([]);
    toast({ title: 'History cleared', description: 'All saved scans have been removed.' });
  };

  const handleViewHistory = (item: HistoryItem) => {
    setSourceImage(item.thumbnail);
    setResult({
      text: item.recognizedText,
      language: item.languageLabel,
      isSingleCharacter: item.isSingleCharacter,
      characterInsight: item.characterInsight,
    });
    setError(null);
    setHistoryOpen(false);
  };

  const canRecognize = !isProcessing;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: '1.5s' }}
        />
      </div>

      <div className="relative">
        <HeaderBanner
          onOpenHistory={() => setHistoryOpen(true)}
          historyCount={historyItems.length}
        />

        {/* Hero section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-2xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass mb-4">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-muted-foreground">
                Powered by Google Gemini AI
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              <span className="text-gradient">Recognize Handwritten Text</span>
              <br />
              in 13+ Scripts
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Draw, upload, or capture handwritten characters and words. Get accurate Unicode
              transcription with pronunciation and character insights.
            </p>
          </motion.div>
        </section>

        {/* Main app */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
            {/* Left: Input + Output */}
            <div className="flex flex-col gap-6">
              {/* Input section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="glass rounded-2xl p-4 sm:p-6"
              >
                <InputTabs
                  ref={inputTabsRef}
                  mode={mode}
                  onModeChange={setMode}
                  disabled={isProcessing}
                />
              </motion.div>

              {/* Recognize button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleRecognize}
                  disabled={!canRecognize}
                  size="lg"
                  className="rounded-2xl h-14 px-8 bg-gradient-brand text-white hover:opacity-90 shadow-glow text-base font-semibold relative overflow-hidden group"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {isProcessing ? 'Recognizing...' : 'Recognize Handwriting'}
                </Button>
              </div>

              {/* Output section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <OutputPanel
                  result={result}
                  sourceImage={sourceImage}
                  isProcessing={isProcessing}
                  error={error}
                />
              </motion.div>
            </div>

            {/* Right: Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:sticky lg:top-24 h-fit"
            >
              <SidebarSettings
                language={language}
                onLanguageChange={setLanguage}
                customLanguage={customLanguage}
                onCustomLanguageChange={setCustomLanguage}
              />

              {/* Supported languages info */}
              <div className="glass rounded-2xl p-5 mt-4">
                <h3 className="text-sm font-semibold mb-3">Supported Scripts</h3>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.filter((l) => l.code !== 'other').map((lang) => (
                    <span
                      key={lang.code}
                      className="px-2 py-1 rounded-lg bg-muted/50 text-xs flex items-center gap-1"
                    >
                      <span className="text-sm">{lang.nativeLabel}</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </main>

        {/* Footer */}
        <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-border/40">
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs text-muted-foreground">
            <span>NeuralScript AI — Multilingual Handwritten Character & Text Recognition</span>
            <span>Powered by Google Gemini</span>
          </div>
        </footer>
      </div>

      <HistoryDrawer
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        items={historyItems}
        onDelete={handleDeleteHistory}
        onClearAll={handleClearHistory}
        onView={handleViewHistory}
      />
    </div>
  );
}
