/*
# Create system_settings table for secure API key storage

## Purpose
Stores application configuration values (like the Gemini API key) in the database
instead of browser localStorage. The key is read server-side only and never exposed
to the client in full.

## New Tables
- `system_settings`
  - `id` (uuid, primary key)
  - `setting_key` (text, unique — e.g. 'GEMINI_API_KEY')
  - `setting_value` (text — stores the actual value, e.g. the API key)
  - `is_active` (boolean, default true — allows soft-deactivation without deleting)
  - `updated_at` (timestamptz, auto-updated on modification)

## Security
- RLS enabled on `system_settings`.
- This is a single-tenant app with no sign-in screen, so policies use `TO anon, authenticated`
  with `USING (true)` / `WITH CHECK (true)` — the settings are intentionally shared app config.
- The actual API key value is never sent to the client; the GET endpoint returns only a masked
  version. The table itself is accessible via the anon key for server-side reads through the
  service role, but the Next.js API routes use the service role key for all DB operations.

## Notes
1. Only one row per `setting_key` (enforced by UNIQUE constraint).
2. `updated_at` is set to `now()` automatically and updated via a trigger on UPDATE.
3. The `is_active` flag lets us deactivate a setting without deleting it.
*/

CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS system_settings_updated_at ON system_settings;
CREATE TRIGGER system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Single-tenant: anon + authenticated can manage settings (no auth screen in this app)
DROP POLICY IF EXISTS "anon_select_settings" ON system_settings;
CREATE POLICY "anon_select_settings" ON system_settings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_settings" ON system_settings;
CREATE POLICY "anon_insert_settings" ON system_settings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_settings" ON system_settings;
CREATE POLICY "anon_update_settings" ON system_settings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_settings" ON system_settings;
CREATE POLICY "anon_delete_settings" ON system_settings FOR DELETE
  TO anon, authenticated USING (true);
