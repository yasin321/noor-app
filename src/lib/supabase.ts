import { createClient } from '@supabase/supabase-js';

const configuredSupabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const configuredSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function isValidSupabaseUrl(value: string | undefined): value is string {
  if (!value) return false;

  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') &&
      Boolean(url.hostname) &&
      !url.username &&
      !url.password;
  } catch {
    return false;
  }
}

const validSupabaseUrl = isValidSupabaseUrl(configuredSupabaseUrl);
export const isSupabaseConfigured = validSupabaseUrl && Boolean(configuredSupabaseAnonKey);

// Keep guest mode renderable even if build-time Supabase secrets are missing or
// malformed. Never pass an invalid environment value to createClient: it throws
// during module initialization and leaves the Android WebView on the splash screen.
export const supabase = createClient(
  validSupabaseUrl ? configuredSupabaseUrl : 'https://configuration-missing.supabase.co',
  isSupabaseConfigured ? configuredSupabaseAnonKey : 'configuration-missing-anon-key',
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
