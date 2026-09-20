import { GoogleGenerativeAI } from '@google/generative-ai';

export const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite'] as const;

export function getGenAIModel(apiKey: string, preferred?: string) {
  // Next.js ಗೆ ಹೊಂದಿಕೊಳ್ಳುವ ಸುರಕ್ಷಿತ Key Loading
  const envKey =
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.GEMINI_API_KEY ||
    'AQ.Ab8RN6L6SGJ09Si8nFzhysuvQa55EY-myxDifVjzQNtV4HWbQg';

  // ಹೊರಗಿನಿಂದ ಬಂದ ಕೀ ತಪ್ಪಾಗಿದ್ದರೆ (Supabase ನ eyJ... ಆಗಿದ್ದರೆ), ಸರಿಯಾದ ಕೀ ಬಳಸುವುದು:
  let finalKey = apiKey;
  if (!finalKey || finalKey.startsWith('eyJ') || finalKey.length < 20) {
    finalKey = envKey;
  }

  const genAI = new GoogleGenerativeAI(finalKey);
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
