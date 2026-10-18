/*
# Create profiles table for Noor app

1. New Tables
- `profiles` — stores per-user settings for the Noor Islamic companion app
  - `id` (uuid, PK, references auth.users) — one row per authenticated user
  - `display_name` (text) — user's display name shown in the UI
  - `city_id` (text) — selected city ID for prayer time calculation
  - `calculation_method` (text, default 'jafari') — prayer calculation method
  - `notif_enabled` (boolean, default true) — master notification toggle
  - `theme_id` (text, default 'emerald') — selected UI theme
  - `adhan_id` (text) — selected adhan sound
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `profiles`.
- Owner-scoped CRUD: each authenticated user can only access their own profile row.
- INSERT policy uses WITH CHECK (auth.uid() = id) so only the owner can create their row.
- UPDATE policy uses USING + WITH CHECK so only the owner can modify their row.
- SELECT policy uses USING so only the owner can read their row.
- DELETE policy uses USING so only the owner can delete their row.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text DEFAULT '',
  city_id text DEFAULT 'tehran',
  calculation_method text NOT NULL DEFAULT 'jafari',
  notif_enabled boolean NOT NULL DEFAULT true,
  theme_id text NOT NULL DEFAULT 'emerald',
  adhan_id text DEFAULT 'default',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);
