import type { LanguageOption, LanguageCode } from './types';

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'auto',
    label: 'Auto-Detect',
    nativeLabel: 'Auto',
    script: 'Multi-script',
    unicodeHint: 'Detect the script automatically from the strokes.',
  },
  {
    code: 'kannada',
    label: 'Kannada',
    nativeLabel: 'ಕನ್ನಡ',
    script: 'Kannada',
    unicodeHint:
      "Output strictly Kannada Unicode characters. Use correct conjuncts like 'ಕ್ಕ', 'ಷ್ಟ', 'ನ್ಮ', 'ತ್ರ್ಯ'. Never use Devanagari or phonetic English.",
  },
  {
    code: 'english',
    label: 'English',
    nativeLabel: 'English',
    script: 'Latin',
    unicodeHint: 'Output English text in the Latin alphabet.',
  },
  {
    code: 'telugu',
    label: 'Telugu',
    nativeLabel: 'తెలుగు',
    script: 'Telugu',
    unicodeHint:
      "Output strictly Telugu Unicode with correct vathulu like 'క్క', 'ష్ట'. Never use Devanagari.",
  },
  {
    code: 'hindi',
    label: 'Hindi',
    nativeLabel: 'हिंदी',
    script: 'Devanagari',
    unicodeHint: "Output Devanagari Unicode like 'क्क', 'क्ष'. Never use phonetic English.",
  },
  {
    code: 'tamil',
    label: 'Tamil',
    nativeLabel: 'தமிழ்',
    script: 'Tamil',
    unicodeHint: 'Output strictly Tamil Unicode characters with correct conjuncts.',
  },
  {
    code: 'malayalam',
    label: 'Malayalam',
    nativeLabel: 'മലയാളം',
    script: 'Malayalam',
    unicodeHint: 'Output strictly Malayalam Unicode characters with correct conjuncts.',
  },
  {
    code: 'marathi',
    label: 'Marathi',
    nativeLabel: 'मराठी',
    script: 'Devanagari',
    unicodeHint: "Output Devanagari Unicode like 'क्क', 'क्ष'. Never use phonetic English.",
  },
  {
    code: 'bengali',
    label: 'Bengali',
    nativeLabel: 'বাংলা',
    script: 'Bengali',
    unicodeHint: 'Output strictly Bengali Unicode characters with correct conjuncts.',
  },
  {
    code: 'gujarati',
    label: 'Gujarati',
    nativeLabel: 'ગુજરાતી',
    script: 'Gujarati',
    unicodeHint: 'Output strictly Gujarati Unicode characters with correct conjuncts.',
  },
  {
    code: 'urdu',
    label: 'Urdu',
    nativeLabel: 'اردو',
    script: 'Arabic (Nastaliq)',
    unicodeHint: 'Output strictly Urdu Unicode in Nastaliq style with correct ligatures.',
  },
  {
    code: 'sanskrit',
    label: 'Sanskrit',
    nativeLabel: 'संस्कृत',
    script: 'Devanagari',
    unicodeHint: 'Output Devanagari Unicode with correct conjuncts and anusvara/visarga.',
  },
  {
    code: 'arabic',
    label: 'Arabic',
    nativeLabel: 'العربية',
    script: 'Arabic',
    unicodeHint: 'Output strictly Arabic Unicode with correct ligatures and diacritics.',
  },
  {
    code: 'other',
    label: 'Other',
    nativeLabel: 'Custom',
    script: 'User-specified',
    unicodeHint: 'Output in the user-specified script.',
  },
];

export function getLanguage(code: LanguageCode): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}

export function getLanguageLabel(code: LanguageCode, custom?: string): string {
  if (code === 'other' && custom) return custom;
  const lang = getLanguage(code);
  return lang.label;
}
