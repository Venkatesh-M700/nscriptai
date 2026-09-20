'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  Copy,
  Download,
  FileText,
  FileJson,
  FileType,
  ScanText,
  Sparkles,
  Type,
  Check,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard, downloadText, downloadJson, downloadPdf } from '@/lib/export';
import type { RecognitionResult, CharacterInsight } from '@/lib/types';

interface OutputPanelProps {
  result: RecognitionResult | null;
  sourceImage: string | null;
  isProcessing: boolean;
  error: string | null;
}

export function OutputPanel({ result, sourceImage, isProcessing, error }: OutputPanelProps) {
  const { toast } = useToast();
  const [copied, setCopied] = React.useState(false);
  const [isSpeaking, setIsSpeaking] = React.useState(false);

  const handleSpeak = () => {
    if (!result?.text) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      toast({
        title: 'Text-to-Speech Unavailable',
        description: 'Your browser does not support speech synthesis.',
        variant: 'destructive',
      });
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    setTimeout(() => {
      const textToSpeak = result.text.trim();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const langCode = getSpeechLangCode(result);
      utterance.lang = langCode;
      utterance.rate = 0.85;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang === langCode || v.lang.startsWith(langCode.slice(0, 2))
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
      };

      (window as unknown as { _activeUtterance?: SpeechSynthesisUtterance })._activeUtterance = utterance;

      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }, 60);
  };

  const handleCopy = async () => {
    if (!result?.text) return;
    const ok = await copyToClipboard(result.text);
    if (ok) {
      setCopied(true);
      toast({
        title: 'Copied to clipboard',
        description: 'The recognized text has been copied.',
      });
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast({
        title: 'Copy failed',
        description: 'Could not copy to clipboard. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (format: 'txt' | 'json' | 'pdf') => {
    if (!result?.text) return;
    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    if (format === 'txt') {
      downloadText(result.text, `neuralscript-${ts}.txt`);
    } else if (format === 'json') {
      downloadJson(result.text, result.language, `neuralscript-${ts}.json`);
    } else {
      downloadPdf(result.text, result.language, sourceImage ?? undefined, `neuralscript-${ts}.pdf`);
    }
    toast({ title: 'Download started', description: `Exported as ${format.toUpperCase()}` });
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Source Image Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-2xl p-4 flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <ScanText className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Source Input</h3>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-muted/30 min-h-[120px] flex items-center justify-center">
          {sourceImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={sourceImage}
              alt="Source input"
              className="w-full max-h-[200px] object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground p-8 text-center">
              No input captured yet
            </p>
          )}
        </div>
      </motion.div>

      {/* Output Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-strong rounded-2xl p-5 flex flex-col gap-4 flex-1"
      >
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">AI Extracted Output</h3>
              {result && (
                <p className="text-xs text-muted-foreground">{result.language}</p>
              )}
            </div>
          </div>
          {result && (
            <Badge variant="secondary" className="rounded-full">
              {result.isSingleCharacter ? 'Single Character' : 'Text'}
            </Badge>
          )}
        </div>

        {/* Error state */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing state */}
        <AnimatePresence>
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center gap-4 py-12"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-primary/20" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary"
                />
                <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="text-sm text-muted-foreground">Analyzing handwriting strokes...</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result text */}
        <AnimatePresence>
          {result && !isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col gap-4 flex-1"
            >
              <div className="flex-1 p-4 rounded-xl bg-gradient-brand-soft border border-primary/10 min-h-[80px] flex items-center justify-center">
                <p
                  className="text-2xl sm:text-3xl font-medium text-center text-foreground leading-relaxed break-all"
                  dir="auto"
                >
                  {result.text}
                </p>
              </div>

              {/* Character Insight Card displaying Language, Script & Phonetic */}
              {result.isSingleCharacter && result.characterInsight && (
                <CharacterInsightCard insight={result.characterInsight} char={result.text} />
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSpeak}
                  className="rounded-xl"
                >
                  <Volume2 className={`h-4 w-4 mr-2 ${isSpeaking ? 'animate-pulse text-primary' : ''}`} />
                  {isSpeaking ? 'Stop' : 'Pronounce'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="rounded-xl"
                >
                  {copied ? (
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="rounded-xl">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-xl">
                    <DropdownMenuItem onClick={() => handleDownload('txt')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download as .txt
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('json')}>
                      <FileJson className="h-4 w-4 mr-2" />
                      Download as .json
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('pdf')}>
                      <FileType className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!result && !isProcessing && !error && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 flex-1">
            <Type className="h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Draw, upload, or capture handwriting, then click Recognize to see the AI transcription here.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// Character Insight Card with Language, Script, and Phonetic
function CharacterInsightCard({
  insight,
  char,
}: {
  insight: CharacterInsight;
  char: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-xl glass p-4 flex items-center gap-4"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-brand flex items-center justify-center shrink-0 shadow-glow">
        <span className="text-3xl text-white" dir="auto">{char}</span>
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full text-xs">{insight.category}</Badge>
          {insight.unicodeName && (
            <span className="text-xs text-muted-foreground font-mono">{insight.unicodeName}</span>
          )}
        </div>
        <div className="flex items-center gap-5 text-sm flex-wrap mt-1">
          <div>
            <span className="text-muted-foreground text-xs block">Language</span>
            <p className="font-semibold text-primary">{insight.language || 'Auto'}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Script</span>
            <p className="font-medium">{insight.script}</p>
          </div>
          <div>
            <span className="text-muted-foreground text-xs block">Phonetic</span>
            <p className="font-medium">{insight.phonetic}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getSpeechLangCode(result: RecognitionResult): string {
  const text = result.text.trim();
  const code = text.codePointAt(0) ?? 0;

  if (code >= 0x0c80 && code <= 0x0cff) return 'kn-IN';
  if (code >= 0x0c00 && code <= 0x0c7f) return 'te-IN';
  if (code >= 0x0900 && code <= 0x097f) return 'hi-IN';
  if (code >= 0x0b80 && code <= 0x0bff) return 'ta-IN';
  if (code >= 0x0d00 && code <= 0x0d7f) return 'ml-IN';
  if (code >= 0x0980 && code <= 0x09ff) return 'bn-IN';
  if (code >= 0x0a80 && code <= 0x0aff) return 'gu-IN';
  if (code >= 0x0600 && code <= 0x06ff) return 'ar-SA';
  if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) return 'en-US';

  if (result.characterInsight?.script) {
    const s = result.characterInsight.script.toLowerCase();
    if (s.includes('kannada')) return 'kn-IN';
    if (s.includes('telugu')) return 'te-IN';
    if (s.includes('devanagari')) return 'hi-IN';
    if (s.includes('tamil')) return 'ta-IN';
    if (s.includes('malayalam')) return 'ml-IN';
    if (s.includes('latin')) return 'en-US';
  }

  return 'kn-IN';
}
