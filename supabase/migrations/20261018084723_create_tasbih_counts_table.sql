/*
# Create tasbih_counts table for Noor app

1. New Tables
- `tasbih_counts` — stores per-user tasbih (dhikr counter) data
  - `id` (uuid, PK)
  - `user_id` (uuid, NOT NULL, DEFAULT auth.uid(), references auth.users) — owner
  - `dhikr_id` (text) — which dhikr was counted
  - `count` (integer, default 0) — current count in session
  - `target` (integer, default 33) — target count for one round
  - `completed` (integer, default 0) — number of completed rounds
  - `date` (date) — the day this count belongs to (local date)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

2. Security
- Enable RLS on `tasbih_counts`.
- Owner-scoped CRUD: each authenticated user can only access their own counts.
- user_id defaults to auth.uid() so inserts that omit user_id succeed.
*/

CREATE TABLE IF NOT EXISTS tasbih_counts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  dhikr_id text NOT NULL DEFAULT 'subhanallah',
  count integer NOT NULL DEFAULT 0,
  target integer NOT NULL DEFAULT 33,
  completed integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tasbih_counts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_tasbih" ON tasbih_counts;
CREATE POLICY "select_own_tasbih"
  ON tasbih_counts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_tasbih" ON tasbih_counts;
CREATE POLICY "insert_own_tasbih"
  ON tasbih_counts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_tasbih" ON tasbih_counts;
CREATE POLICY "update_own_tasbih"
  ON tasbih_counts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_tasbih" ON tasbih_counts;
CREATE POLICY "delete_own_tasbih"
  ON tasbih_counts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
