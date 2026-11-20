import { useState, useCallback, useEffect } from 'react';
import {
  getSession,
  saveSession,
  startSession,
  incrementCount,
  resetSession,
  clearSession,
} from '@/lib/tasbihStorage';

export const TASBIH_SESSION_CHANGED_EVENT = 'noor-tasbih-session-changed';

export function notifyTasbihSessionChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TASBIH_SESSION_CHANGED_EVENT));
  }
}

export function useTasbih(userId?: string | null) {
  const [session, setSession] = useState(getSession);

  useEffect(() => {
    const sync = () => setSession(getSession());
    window.addEventListener(TASBIH_SESSION_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(TASBIH_SESSION_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const start = useCallback((dhikrId: string, target: number) => {
    startSession(dhikrId, target);
    setSession(getSession());
    notifyTasbihSessionChanged();
  }, []);

  const increment = useCallback(() => {
    const result = incrementCount(userId);
    setSession(getSession());
    notifyTasbihSessionChanged();
    return result;
  }, [userId]);

  const decrement = useCallback(() => {
    const cur = getSession();
    if (cur.count > 0) {
      saveSession({ ...cur, count: cur.count - 1 });
      setSession(getSession());
      notifyTasbihSessionChanged();
    }
  }, []);

  const reset = useCallback(() => {
    resetSession();
    setSession(getSession());
    notifyTasbihSessionChanged();
  }, []);

  const clear = useCallback(() => {
    clearSession();
    setSession(getSession());
    notifyTasbihSessionChanged();
  }, []);

  const save = useCallback((s: typeof session) => {
    saveSession(s);
    setSession(getSession());
    notifyTasbihSessionChanged();
  }, []);

  return { session, start, increment, decrement, reset, clear, save };
}
