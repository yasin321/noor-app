import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadAdhanStudio, loadQuranContinuity, loadMosqueAndTravel } from '@/lib/deenIntelligenceStore';
import { loadReminders } from '@/lib/reminderStorage';

export async function syncLocalStateToCloud(userId: string | null | undefined): Promise<boolean> {
  if (!userId || !isSupabaseConfigured) return false;
  try {
    const appSettings = {
      fontFamily: localStorage.getItem('noor_font_family') || 'Vazirmatn',
      fontScale: localStorage.getItem('noor_font_scale') || 'normal',
      quranDisplayMode: localStorage.getItem('noor_quran_display_mode_v1') || 'page',
      adhanDurationMode: localStorage.getItem('noor_adhan_duration_mode_v1') || 'full',
      adhanStudio: loadAdhanStudio(),
      mosqueTravel: loadMosqueAndTravel(),
    };
    const quranState = loadQuranContinuity();
    const remindersBackup = {
      reminders: loadReminders(),
      completionLog: JSON.parse(localStorage.getItem('noor_reminders_completion_log_v1') || '{}'),
    };

    const { error } = await supabase
      .from('profiles')
      .update({
        app_settings: appSettings,
        quran_state: quranState,
        reminders_backup: remindersBackup,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    return !error;
  } catch {
    return false;
  }
}
