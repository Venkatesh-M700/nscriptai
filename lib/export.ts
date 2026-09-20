import { jsPDF } from 'jspdf';
import type { HistoryItem } from './types';

export function downloadText(text: string, filename = 'recognition.txt'): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

export function downloadJson(
  text: string,
  language: string,
  filename = 'recognition.json'
): void {
  const payload = {
    recognizedText: text,
    language,
    timestamp: new Date().toISOString(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, filename);
}

export function downloadPdf(
  text: string,
  language: string,
  thumbnail?: string,
  filename = 'recognition.pdf'
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;

  doc.setFontSize(20);
  doc.setTextColor(79, 70, 229);
  doc.text('NeuralScript AI', margin, 25);

  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Language: ${language}`, margin, 33);
  doc.text(`Date: ${new Date().toLocaleString()}`, margin, 39);

  doc.setDrawColor(79, 70, 229);
  doc.setLineWidth(0.5);
  doc.line(margin, 44, pageWidth - margin, 44);

  doc.setFontSize(14);
  doc.setTextColor(30, 30, 30);

  // Insert thumbnail image if provided
  let y = 54;
  if (thumbnail) {
    try {
      const imgData = thumbnail;
      const imgWidth = 80;
      const imgHeight = 60;
      doc.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
      y += imgHeight + 10;
    } catch {
      // skip image on error
    }
  }

  doc.text('Recognized Text:', margin, y);
  y += 8;
  doc.setFontSize(12);

  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, margin, y);

  doc.save(filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for non-secure contexts
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
