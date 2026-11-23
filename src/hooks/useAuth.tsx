import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase, isSupabaseConfigured, type Profile } from '@/lib/supabase';
import {
  isValidGlobalPhone,
  normalizeGlobalPhone,
  phoneToSyntheticEmail,
  getLocalAuthSession,
  clearLocalAuthSession,
  localSignInWithPhone,
  localSignUpWithPhone,
  updateLocalAccountDisplayName,
} from '@/lib/authService';
import { getGuestCityId } from '@/lib/cities';
import { syncLocalStateToCloud } from '@/lib/cloudSyncService';
import { saveUserBirthday, type UserBirthday } from '@/lib/inboxService';

type AuthUser = {
  id: string;
  email: string | null;
  phone?: string | null;
  isLocalAccount?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (phoneOrEmail: string, password: string) => Promise<{ error: string | null }>;
  signUp: (phoneOrEmail: string, password: string, displayName: string, birthday?: UserBirthday | null) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function buildLocalProfile(userId: string, displayName: string): Profile {
  return {
    id: userId,
    display_name: displayName,
    city_id: getGuestCityId(),
    calculation_method: 'tehran',
    theme_id: 'emerald',
    notif_enabled: true,
    adhan_id: (typeof localStorage !== 'undefined' && localStorage.getItem('noor_guest_adhan_id')) || 'moazenzadeh_ardabili',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) return;

    if (!data) {
      const { error: insertError } = await supabase.from('profiles').insert({ id: uid });
      if (insertError) return;

      const { data: newData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      if (newData) setProfile(newData as Profile);
    } else {
      setProfile(data as Profile);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      const localSession = getLocalAuthSession();
      if (localSession) {
        setUser({
          id: localSession.userId,
          email: null,
          phone: localSession.phone,
          isLocalAccount: true,
        });
        setProfile(buildLocalProfile(localSession.userId, localSession.displayName));
      }
      setLoading(false);
      return;
    }

    let mounted = true;

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const phoneMeta =
            (session.user.user_metadata?.phone as string | undefined) ?? session.user.phone ?? null;
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
            phone: phoneMeta,
          });
          void fetchProfile(session.user.id);
        }
        setLoading(false);
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (session?.user) {
          const phoneMeta =
            (session.user.user_metadata?.phone as string | undefined) ?? session.user.phone ?? null;
          setUser({
            id: session.user.id,
            email: session.user.email ?? null,
            phone: phoneMeta,
          });
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(async (phoneOrEmail: string, password: string) => {
    const isPhone = isValidGlobalPhone(phoneOrEmail);
    const normalizedPhone = isPhone ? normalizeGlobalPhone(phoneOrEmail) : null;

    if (!isSupabaseConfigured) {
      const res = await localSignInWithPhone(phoneOrEmail, password);
      if (res.error || !res.session) return { error: res.error ?? 'خطا در ورود به حساب' };
      setUser({
        id: res.session.userId,
        email: null,
        phone: res.session.phone,
        isLocalAccount: true,
      });
      setProfile(buildLocalProfile(res.session.userId, res.session.displayName));
      return { error: null };
    }

    const emailForAuth = normalizedPhone ? phoneToSyntheticEmail(normalizedPhone) : phoneOrEmail.trim();
    const { error } = await supabase.auth.signInWithPassword({ email: emailForAuth, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (phoneOrEmail: string, password: string, displayName: string, birthday?: UserBirthday | null) => {
    const isPhone = isValidGlobalPhone(phoneOrEmail);
    const normalizedPhone = isPhone ? normalizeGlobalPhone(phoneOrEmail) : null;

    if (!isSupabaseConfigured) {
      const res = await localSignUpWithPhone(phoneOrEmail, password, displayName);
      if (res.error || !res.session) return { error: res.error ?? 'خطا در ساخت حساب کاربری' };
      setUser({
        id: res.session.userId,
        email: null,
        phone: res.session.phone,
        isLocalAccount: true,
      });
      setProfile(buildLocalProfile(res.session.userId, res.session.displayName));
      if (birthday) await saveUserBirthday(birthday, null);
      return { error: null };
    }

    const emailForAuth = normalizedPhone ? phoneToSyntheticEmail(normalizedPhone) : phoneOrEmail.trim();
    const { data, error } = await supabase.auth.signUp({
      email: emailForAuth,
      password,
      options: {
        data: {
          display_name: displayName,
          phone: normalizedPhone,
        },
      },
    });
    if (error) return { error: error.message };
    if (data.user) {
      const profilePayload: Record<string, unknown> = {
        id: data.user.id,
        display_name: displayName,
        phone: normalizedPhone,
      };
      if (birthday) {
        profilePayload.birth_month = birthday.month;
        profilePayload.birth_day = birthday.day;
        if (birthday.year) profilePayload.birth_year = birthday.year;
      }
      await supabase.from('profiles').upsert(profilePayload);
      if (birthday) {
        await saveUserBirthday(birthday, data.user.id);
      }
      void syncLocalStateToCloud(data.user.id);
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    if (user?.id && isSupabaseConfigured && !user.isLocalAccount) {
      try {
        await Promise.race([
          syncLocalStateToCloud(user.id),
          new Promise((resolve) => setTimeout(resolve, 4500)),
        ]);
      } catch {}
    }
    clearLocalAuthSession();
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, [user]);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      if (!user) return;
      if (!isSupabaseConfigured || user.isLocalAccount) {
        if (updates.display_name) {
          updateLocalAccountDisplayName(user.id, updates.display_name);
        }
        setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (error) return;
      setProfile((prev) => (prev ? { ...prev, ...updates } : prev));
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
