import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Keep the app renderable in guest mode when deployment environment variables
// are missing. Auth operations are explicitly disabled until configuration exists.
export const supabase = createClient(
  supabaseUrl || 'https://configuration-missing.supabase.co',
  supabaseAnonKey || 'configuration-missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);

export type Profile = {
  id: string;
  display_name: string;
  city_id: string;
  calculation_method: string;
  notif_enabled: boolean;
  theme_id: string;
  adhan_id: string;
};
