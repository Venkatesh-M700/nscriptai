import { NextRequest, NextResponse } from 'next/server';
import { getGenAIModel, GEMINI_MODELS, buildRecognitionPrompt } from '@/lib/gemini';
import { getLanguage } from '@/lib/languages';
import { getActiveSetting } from '@/lib/supabase-server';
import type { LanguageCode } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function resolveApiKey(): Promise<string | null> {
  // 1. Try database
  const dbKey = await getActiveSetting('GEMINI_API_KEY');
  if (dbKey) return dbKey;

  // 2. Fall back to environment variable
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      imageBase64,
      mimeType,
      language,
      customLanguage,
    }: {
      imageBase64: string;
      mimeType: string;
      language: LanguageCode;
      customLanguage?: string;
    } = body;

    if (!imageBase64 || !mimeType) {
      return NextResponse.json(
        { error: 'Missing image data. Please provide an image to recognize.' },
        { status: 400 }
      );
    }

    // Strip data URL prefix if present
    const base64Data = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const apiKey = await resolveApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            'Gemini API key is not configured. Please add a key via the Settings panel.',
          code: 'NO_API_KEY',
        },
        { status: 503 }
      );
    }

    const lang = getLanguage(language);
    const languageHint =
      language === 'other' && customLanguage ? customLanguage : lang.label;
    const prompt = buildRecognitionPrompt(language, languageHint, lang.unicodeHint);

    let lastError: unknown = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const model = getGenAIModel(apiKey, modelName);
        const result = await model.generateContent([
          { text: prompt },
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
        ]);

        const responseText = result.response.text().trim();
        const parsed = parseResponse(responseText);

        return NextResponse.json({
          text: parsed.text,
          language: languageHint,
          isSingleCharacter: parsed.isSingleCharacter,
          model: modelName,
        });
      } catch (err) {
        lastError = err;
        continue;
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : 'Unknown recognition error';
    const isQuota =
      message.toLowerCase().includes('quota') || message.toLowerCase().includes('429');
    const isInvalidKey =
      message.toLowerCase().includes('api key not valid') ||
      message.toLowerCase().includes('invalid_api_key') ||
      message.toLowerCase().includes('403');

    return NextResponse.json(
      {
        error: isQuota
          ? 'API quota exceeded. Please check your Gemini API usage limits or try again later.'
          : isInvalidKey
            ? 'The configured API key is invalid. Please update it in the Settings panel.'
            : `Recognition failed: ${message}`,
        code: isQuota
          ? 'QUOTA_EXCEEDED'
          : isInvalidKey
            ? 'INVALID_API_KEY'
            : 'RECOGNITION_ERROR',
      },
      { status: isQuota ? 429 : isInvalidKey ? 401 : 500 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseResponse(text: string): { text: string; isSingleCharacter: boolean } {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(cleaned);
    return {
      text: String(json.text ?? ''),
      isSingleCharacter: Boolean(json.isSingleCharacter),
    };
  } catch {
    return {
      text: text.replace(/```json/g, '').replace(/```/g, '').trim(),
      isSingleCharacter: false,
    };
  }
}
