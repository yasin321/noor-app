import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, getSession, startSession, clearSession, getTodayTotal, getTodayRounds, incrementCount } from '@/lib/tasbihStorage';

describe('tasbihStorage', () => {
  beforeEach(() => {
    clearSession();
    localStorage.removeItem('noor_tasbih_store');
  });

  it('should start a session', () => {
    startSession('subhanallah', 33);
    const s = getSession();
    expect(s.dhikrId).toBe('subhanallah');
    expect(s.count).toBe(0);
    expect(s.target).toBe(33);
    expect(s.completed).toBe(0);
  });

  it('should save and load session', () => {
    saveSession({ dhikrId: 'alhamdulillah', count: 15, target: 33, completed: 2 });
    const s = getSession();
    expect(s.dhikrId).toBe('alhamdulillah');
    expect(s.count).toBe(15);
    expect(s.target).toBe(33);
    expect(s.completed).toBe(2);
  });

  it('should return default session when empty', () => {
    const s = getSession();
    expect(s.dhikrId).toBe('');
    expect(s.count).toBe(0);
    expect(s.target).toBe(33);
  });

  it('should clear session', () => {
    saveSession({ dhikrId: 'subhanallah', count: 10, target: 33, completed: 1 });
    clearSession();
    const s = getSession();
    expect(s.dhikrId).toBe('');
    expect(s.count).toBe(0);
  });

  it('increments without losing counts before the target', () => {
    startSession('subhanallah', 33);
    for (let i = 0; i < 32; i++) {
      const result = incrementCount();
      expect(result.reachedTarget).toBe(false);
    }
    expect(getSession().count).toBe(32);
    expect(getSession().completed).toBe(0);
  });

  it('completes a round exactly at the target and starts the next round at zero', () => {
    startSession('subhanallah', 33);
    for (let i = 0; i < 32; i++) incrementCount();
    const result = incrementCount();
    expect(result).toEqual({ count: 0, completed: 1, reachedTarget: true });
    expect(getSession()).toEqual({ dhikrId: 'subhanallah', count: 0, target: 33, completed: 1 });
    expect(getTodayTotal()).toBe(33);
    expect(getTodayRounds()).toBe(1);
  });

  it('should return 0 for today when no records', () => {
    expect(getTodayTotal()).toBe(0);
    expect(getTodayRounds()).toBe(0);
  });
});
