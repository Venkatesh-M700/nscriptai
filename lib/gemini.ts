import { GoogleGenerativeAI } from '@google/generative-ai';

// gemini-2.0-flash ಮತ್ತು gemini-1.5-flash ಬದಲಿಗೆ gemini-3.6-flash ಅಪ್‌ಡೇಟ್ ಮಾಡಲಾಗಿದೆ
export const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'] as const;

export function getGenAIModel(apiKey: string, preferred?: string) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model =
    preferred && GEMINI_MODELS.includes(preferred as (typeof GEMINI_MODELS)[number])
      ? preferred
      : GEMINI_MODELS[0];
      
  return genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: 0,
      topP: 0.1,
      maxOutputTokens: 2048,
    },
  });
}

export function buildRecognitionPrompt(
  languageCode: string,
  languageHint: string,
  unicodeHint: string
): string {
  const langSection =
    languageCode === 'auto'
      ? `Detect the script and language of the handwritten text automatically. Then transcribe it in that script.`
      : `The target language is ${languageHint}. ${unicodeHint}`;

  return `You are an expert OCR system specialized in recognizing handwritten text across multiple Indic and world scripts.

${langSection}

Instructions:
1. Carefully analyze the handwritten strokes, curves, and conjuncts in the image.
2. Transcribe exactly what is written — do not add, remove, or correct characters.
3. Output ONLY the recognized text in the correct Unicode script. No explanations, no transliteration, no English unless the source is English.
4. If the input is a single character or conjunct, output just that character.
5. If the text is illegible or unclear, output the best-guess Unicode characters.
6. Never substitute Devanagari for Kannada/Telugu/Tamil/Malayalam/Bengali/Gujarati, or vice versa.
7. Preserve line breaks if multiple lines are visible.

Respond in valid JSON format:
{"text": "<recognized text here>", "isSingleCharacter": <true|false>}

Only output the JSON object. No markdown fences, no commentary.`;
}
