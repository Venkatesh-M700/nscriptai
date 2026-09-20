export type InputMode = 'draw' | 'upload' | 'camera';

export type LanguageCode =
  | 'auto'
  | 'kannada'
  | 'english'
  | 'telugu'
  | 'hindi'
  | 'tamil'
  | 'malayalam'
  | 'marathi'
  | 'bengali'
  | 'gujarati'
  | 'urdu'
  | 'sanskrit'
  | 'arabic'
  | 'other';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  nativeLabel: string;
  script: string;
  unicodeHint: string;
}

export interface RecognitionResult {
  text: string;
  language: string;
  confidence?: number;
  isSingleCharacter: boolean;
  characterInsight?: CharacterInsight;
}

export interface CharacterInsight {
  script: string;
  language?: string; // <-- ಇಲ್ಲಿ ಹೊಸದಾಗಿ Language ಫೀಲ್ಡ್ ಸೇರಿಸಲಾಗಿದೆ
  phonetic: string;
  category: string;
  unicodeName?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  thumbnail: string;
  recognizedText: string;
  language: string;
  languageLabel: string;
  mode: InputMode;
  isSingleCharacter: boolean;
  characterInsight?: CharacterInsight;
}

export interface RecognitionRequest {
  imageBase64: string;
  mimeType: string;
  language: LanguageCode;
  customLanguage?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}
