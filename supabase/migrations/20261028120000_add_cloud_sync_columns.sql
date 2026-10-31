/*
# Add Cloud Sync JSONB columns to profiles table for full backup & restore

1. New Columns on `profiles`:
  - `app_settings` (jsonb) — stores font, scale, quran display mode, home modules visibility, and adhan studio config
  - `quran_state` (jsonb) — stores surah index, ayah number, bookmarks, and continuity state
  - `reminders_backup` (jsonb) — stores user's custom reminders, chillas, and completion logs
*/

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS app_settings jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS quran_state jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reminders_backup jsonb DEFAULT '{}'::jsonb;
