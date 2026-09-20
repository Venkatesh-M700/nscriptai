import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Supabase server credentials are not configured.');
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getActiveSetting(key: string): Promise<string | null> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', key)
      .eq('is_active', true)
      .maybeSingle();

    if (error || !data) return null;
    return data.setting_value;
  } catch {
    return null;
  }
}

export async function upsertSetting(key: string, value: string): Promise<boolean> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .from('system_settings')
      .upsert(
        { setting_key: key, setting_value: value, is_active: true },
        { onConflict: 'setting_key' }
      );

    if (error) return false;
    return true;
  } catch {
    return false;
  }
}

export function maskApiKey(key: string): string {
  if (!key || key.length < 10) return '****';
  const prefix = key.slice(0, 6);
  const suffix = key.slice(-2);
  return `${prefix}...****${suffix}`;
}
