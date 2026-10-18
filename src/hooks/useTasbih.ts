import { useState, useCallback } from 'react';
import {
  getSession,
  saveSession,
  startSession,
  incrementCount,
  resetSession,
  clearSession,
} from '@/lib/tasbihStorage';

export function useTasbih(userId?: string | null) {
  const [session, setSession] = useState(getSession());

  const start = useCallback((dhikrId: string, target: number) => {
    startSession(dhikrId, target);
    setSession(getSession());
  }, []);

  const increment = useCallback(() => {
    const result = incrementCount(userId);
    setSession(getSession());
    return result;
  }, [userId]);

  const reset = useCallback(() => {
    resetSession();
    setSession(getSession());
  }, []);

  const clear = useCallback(() => {
    clearSession();
    setSession(getSession());
  }, []);

  const save = useCallback((s: typeof session) => {
    saveSession(s);
    setSession(getSession());
  }, [session]);

  return { session, start, increment, reset, clear, save };
}
