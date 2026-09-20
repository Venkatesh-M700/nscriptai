import type { CharacterInsight, LanguageCode } from './types';

// ಲಿಪಿಗಳ ಹೆಸರುಗಳು (Scripts)
const SCRIPT_NAMES: Record<string, string> = {
  kannada: 'Kannada',
  english: 'Latin',
  telugu: 'Telugu',
  hindi: 'Devanagari',
  tamil: 'Tamil',
  malayalam: 'Malayalam',
  marathi: 'Devanagari',
  bengali: 'Bengali',
  gujarati: 'Gujarati',
  urdu: 'Arabic (Nastaliq)',
  sanskrit: 'Devanagari',
  arabic: 'Arabic',
  other: 'Custom',
  auto: 'Auto-detected',
};

// ಭಾಷೆಗಳ ಹೆಸರುಗಳು (Languages)
const LANGUAGE_NAMES: Record<string, string> = {
  kannada: 'Kannada',
  english: 'English',
  telugu: 'Telugu',
  hindi: 'Hindi',
  tamil: 'Tamil',
  malayalam: 'Malayalam',
  marathi: 'Marathi',
  bengali: 'Bengali',
  gujarati: 'Gujarati',
  urdu: 'Urdu',
  sanskrit: 'Sanskrit',
  arabic: 'Arabic',
  other: 'Custom',
  auto: 'Auto',
};

export function isSingleCharacter(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length === 0) return false;
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const count = Array.from(seg.segment(trimmed)).length;
      return count === 1;
    } catch {
      // fall through
    }
  }
  return trimmed.length <= 4 && !trimmed.includes(' ');
}

export function classifyCharacter(
  text: string,
  language: LanguageCode,
  customLanguage?: string
): CharacterInsight {
  const trimmed = text.trim();
  let script = SCRIPT_NAMES[language] ?? 'Unknown';
  let detectedLang = LANGUAGE_NAMES[language] ?? (customLanguage || 'Unknown');

  const codePoint = trimmed.codePointAt(0);

  // Auto-Detect ಆಯ್ಕೆ ಮಾಡಿದಾಗ ಯುನಿಕೋಡ್ ರೇಂಜ್ ನೋಡಿ Language & Script ಎರಡನ್ನೂ ನಿಖರವಾಗಿ ಪತ್ತೆಹಚ್ಚುವುದು
  if (codePoint !== undefined) {
    if (codePoint >= 0x0900 && codePoint <= 0x097f) {
      script = 'Devanagari';
      detectedLang = language === 'marathi' ? 'Marathi' : language === 'sanskrit' ? 'Sanskrit' : 'Hindi';
    } else if (codePoint >= 0x0c80 && codePoint <= 0x0cff) {
      script = 'Kannada';
      detectedLang = 'Kannada';
    } else if (codePoint >= 0x0c00 && codePoint <= 0x0c7f) {
      script = 'Telugu';
      detectedLang = 'Telugu';
    } else if (codePoint >= 0x0b80 && codePoint <= 0x0bff) {
      script = 'Tamil';
      detectedLang = 'Tamil';
    } else if (codePoint >= 0x0d00 && codePoint <= 0x0d7f) {
      script = 'Malayalam';
      detectedLang = 'Malayalam';
    } else if (codePoint >= 0x0980 && codePoint <= 0x09ff) {
      script = 'Bengali';
      detectedLang = 'Bengali';
    } else if (codePoint >= 0x0a80 && codePoint <= 0x0aff) {
      script = 'Gujarati';
      detectedLang = 'Gujarati';
    } else if (codePoint >= 0x0600 && codePoint <= 0x06ff) {
      script = 'Arabic';
      detectedLang = language === 'urdu' ? 'Urdu' : 'Arabic';
    } else if ((codePoint >= 0x41 && codePoint <= 0x5a) || (codePoint >= 0x61 && codePoint <= 0x7a)) {
      script = 'Latin';
      detectedLang = 'English';
    }
  }

  // Try to get a Unicode name
  let unicodeName: string | undefined;
  try {
    if (codePoint !== undefined) {
      unicodeName = `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`;
    }
  } catch {
    // ignore
  }

  const category = guessCategory(trimmed, language);
  const phonetic = guessPhonetic(trimmed, language);

  return {
    script,
    language: detectedLang, // Language ಫೀಲ್ಡ್ ಪಾಸ್ ಆಗುತ್ತದೆ
    phonetic,
    category,
    unicodeName,
  };
}

function guessCategory(text: string, language: LanguageCode): string {
  const code = text.codePointAt(0) ?? 0;

  // Latin / English
  if (code >= 0x41 && code <= 0x7a) {
    const lower = text.toLowerCase();
    if ('aeiou'.includes(lower[0]!)) return 'Vowel letter';
    return 'Consonant letter';
  }

  // Devanagari range 0x0900–0x097F
  if (code >= 0x0900 && code <= 0x097f) {
    if (code >= 0x0904 && code <= 0x0914) return 'Vowel (Svara)';
    if (code >= 0x0915 && code <= 0x0939) return 'Consonant (Vyanjana)';
    if (code === 0x093c) return 'Nukta';
    if (code === 0x093d) return 'Avagraha';
    if (code >= 0x093e && code <= 0x094c) return 'Vowel Sign (Matra)';
    if (code === 0x094d) return 'Virama (Halant)';
    if (code >= 0x0966 && code <= 0x096f) return 'Digit';
    return 'Conjunct / Modifier';
  }

  // Kannada range 0x0C80–0x0CFF
  if (code >= 0x0c80 && code <= 0x0cff) {
    if (code >= 0x0c85 && code <= 0x0c94) return 'Vowel (Svara)';
    if (code >= 0x0c95 && code <= 0x0cb9) return 'Consonant (Vyanjana)';
    if (code >= 0x0cc6 && code <= 0x0ccc) return 'Vowel Sign (Matra)';
    if (code === 0x0ccd) return 'Virama (Halant)';
    if (code >= 0x0ce6 && code <= 0x0cef) return 'Digit';
    return 'Conjunct / Modifier';
  }

  // Telugu range 0x0C00–0x0C7F
  if (code >= 0x0c00 && code <= 0x0c7f) {
    if (code >= 0x0c05 && code <= 0x0c14) return 'Vowel (Svara)';
    if (code >= 0x0c15 && code <= 0x0c39) return 'Consonant (Vyanjana)';
    if (code >= 0x0c3e && code <= 0x0c44) return 'Vowel Sign (Matra)';
    if (code === 0x0c4d) return 'Virama (Halant)';
    if (code >= 0x0c66 && code <= 0x0c6f) return 'Digit';
    return 'Conjunct / Modifier';
  }

  // Tamil range 0x0B80–0x0BFF
  if (code >= 0x0b80 && code <= 0x0bff) {
    if (code >= 0x0b85 && code <= 0x0b94) return 'Vowel (Svara)';
    if (code >= 0x0b95 && code <= 0x0bb9) return 'Consonant (Vyanjana)';
    return 'Conjunct / Modifier';
  }

  // Arabic range 0x0600–0x06FF
  if (code >= 0x0600 && code <= 0x06ff) {
    return 'Arabic Letter';
  }

  if (text.length > 2) return 'Conjunct / Compound';
  return 'Character';
}

function guessPhonetic(text: string, language: LanguageCode): string {
  const code = text.codePointAt(0) ?? 0;

  const devaMap: Record<number, string> = {
    0x0905: 'a', 0x0906: 'aa', 0x0907: 'i', 0x0908: 'ii', 0x0909: 'u',
    0x090a: 'uu', 0x090b: 'vocalic r', 0x0915: 'ka', 0x0916: 'kha',
    0x0917: 'ga', 0x0918: 'gha', 0x0919: 'nga', 0x091a: 'cha',
    0x091b: 'chha', 0x091c: 'ja', 0x091d: 'jha', 0x091e: 'nya',
    0x091f: 'ta', 0x0920: 'tha', 0x0921: 'da', 0x0922: 'dha',
    0x0923: 'na', 0x0924: 'ta', 0x0925: 'tha', 0x0926: 'da',
    0x0927: 'dha', 0x0928: 'na', 0x092a: 'pa', 0x092b: 'pha',
    0x092c: 'ba', 0x092d: 'bha', 0x092e: 'ma', 0x092f: 'ya',
    0x0930: 'ra', 0x0932: 'la', 0x0935: 'va', 0x0936: 'sha',
    0x0937: 'ssa', 0x0938: 'sa', 0x0939: 'ha',
  };

  const kannadaMap: Record<number, string> = {
    0x0c85: 'a', 0x0c86: 'aa', 0x0c87: 'i', 0x0c88: 'ii', 0x0c89: 'u',
    0x0c8a: 'uu', 0x0c8b: 'vocalic r', 0x0c8e: 'e', 0x0c8f: 'ee',
    0x0c90: 'ai', 0x0c92: 'o', 0x0c93: 'oo', 0x0c94: 'au',
    0x0c95: 'ka', 0x0c96: 'kha', 0x0c97: 'ga', 0x0c98: 'gha',
    0x0c99: 'nga', 0x0c9a: 'cha', 0x0c9b: 'chha', 0x0c9c: 'ja',
    0x0c9d: 'jha', 0x0c9e: 'nya', 0x0c9f: 'ta', 0x0ca0: 'tha',
    0x0ca1: 'da', 0x0ca2: 'dha', 0x0ca3: 'na', 0x0ca4: 'ta',
    0x0ca5: 'tha', 0x0ca6: 'da', 0x0ca7: 'dha', 0x0ca8: 'na',
    0x0ca9: 'pa', 0x0caa: 'pha', 0x0cab: 'ba', 0x0cac: 'bha',
    0x0cad: 'ma', 0x0cae: 'ya', 0x0caf: 'ra', 0x0cb0: 'ra',
    0x0cb2: 'la', 0x0cb5: 'va', 0x0cb6: 'sha', 0x0cb7: 'ssa',
    0x0cb8: 'sa', 0x0cb9: 'ha',
  };

  const codePoint = text.codePointAt(0) ?? 0;
  if (devaMap[codePoint]) return `/${devaMap[codePoint]}/`;
  if (kannadaMap[codePoint]) return `/${kannadaMap[codePoint]}/`;
  if (codePoint >= 0x41 && codePoint <= 0x7a) return `/${text.toLowerCase()}/`;

  return 'Tap speaker to hear';
}
