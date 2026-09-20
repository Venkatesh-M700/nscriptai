'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  Search,
  Trash2,
  Copy,
  Eye,
  X,
  Clock,
  Languages,
  Inbox,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { copyToClipboard } from '@/lib/export';
import { formatTimeAgo } from '@/lib/history';
import type { HistoryItem } from '@/lib/types';

interface HistoryDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: HistoryItem[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onView: (item: HistoryItem) => void;
}

export function HistoryDrawer({
  open,
  onOpenChange,
  items,
  onDelete,
  onClearAll,
  onView,
}: HistoryDrawerProps) {
  const { toast } = useToast();
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (item) =>
        item.recognizedText.toLowerCase().includes(q) ||
        item.languageLabel.toLowerCase().includes(q) ||
        item.language.toLowerCase().includes(q)
    );
  }, [items, search]);

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast({
      title: ok ? 'Copied to clipboard' : 'Copy failed',
      variant: ok ? 'default' : 'destructive',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="glass-strong rounded-l-2xl w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Recognition History
          </SheetTitle>
          <SheetDescription>
            {items.length} saved {items.length === 1 ? 'scan' : 'scans'} — stored locally on your device
          </SheetDescription>
        </SheetHeader>

        {/* Search */}
        <div className="p-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by text or language..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl pl-10 pr-10"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearch('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <Inbox className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground text-center">
                {items.length === 0
                  ? 'No scans yet. Recognize some handwriting to build your history.'
                  : 'No results match your search.'}
              </p>
            </div>
          ) : (
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 300 }}
                  className="glass rounded-2xl p-3 flex gap-3 group hover:shadow-glow transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-muted/30 shrink-0 flex items-center justify-center">
                    {item.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail}
                        alt="Scan thumbnail"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <History className="h-6 w-6 text-muted-foreground/40" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <p
                      className="text-sm font-medium truncate"
                      dir="auto"
                    >
                      {item.recognizedText}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="rounded-full text-xs">
                        <Languages className="h-2.5 w-2.5 mr-1" />
                        {item.languageLabel}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-2.5 w-2.5" />
                        {formatTimeAgo(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onView(item)}
                      className="h-7 w-7 rounded-lg"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleCopy(item.recognizedText)}
                      className="h-7 w-7 rounded-lg"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item.id)}
                      className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Clear all */}
        {items.length > 0 && (
          <div className="p-4 border-t border-border/50">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full rounded-xl text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="glass-strong rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all scans?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove all {items.length} saved scans from your device. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onClearAll}
                    className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
