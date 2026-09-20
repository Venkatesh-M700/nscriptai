import { NextRequest, NextResponse } from 'next/server';
import { getActiveSetting, upsertSetting, maskApiKey } from '@/lib/supabase-server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const dbKey = await getActiveSetting('GEMINI_API_KEY');
    const envKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || null;

    const activeKey = dbKey || envKey;
    const source = dbKey ? 'database' : envKey ? 'env' : 'none';

    return NextResponse.json({
      configured: !!activeKey,
      source,
      maskedKey: activeKey ? maskApiKey(activeKey) : null,
    });
  } catch {
    return NextResponse.json(
      {
        configured: false,
        source: 'none',
        maskedKey: null,
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey }: { apiKey?: string } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: 'API key is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const trimmedKey = apiKey.trim();

    // Validate key format — Google Gemini keys typically start with "AIza"
    if (!trimmedKey.startsWith('AIza')) {
      return NextResponse.json(
        { error: 'Invalid key format. Gemini API keys typically start with "AIza".' },
        { status: 400 }
      );
    }

    // Test the key with a lightweight call to Gemini API
    try {
      const genAI = new GoogleGenerativeAI(trimmedKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { temperature: 0, maxOutputTokens: 1 },
      });
      await model.generateContent([{ text: 'Reply with the single letter: OK' }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      const isInvalidKey =
        msg.toLowerCase().includes('api key not valid') ||
        msg.toLowerCase().includes('invalid_api_key') ||
        msg.toLowerCase().includes('permission') ||
        msg.toLowerCase().includes('403');
      const isQuota =
        msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('429');

      if (isInvalidKey) {
        return NextResponse.json(
          { error: 'The API key was rejected by Google. Please verify it is a valid Gemini API key.' },
          { status: 400 }
        );
      }
      if (isQuota) {
        return NextResponse.json(
          { error: 'The API key is valid but has exceeded its quota. The key was still saved to the database.' },
          { status: 200 }
        );
      }
      // For other errors, still try to save — the key might work for multimodal
    }

    // Upsert into database
    const saved = await upsertSetting('GEMINI_API_KEY', trimmedKey);
    if (!saved) {
      return NextResponse.json(
        { error: 'Failed to save the API key to the database. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      maskedKey: maskApiKey(trimmedKey),
      source: 'database',
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
