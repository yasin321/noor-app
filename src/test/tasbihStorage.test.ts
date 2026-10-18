import { describe, it, expect, beforeEach } from 'vitest';
import { saveSession, getSession, startSession, clearSession, getTodayTotal, getTodayRounds } from '@/lib/tasbihStorage';

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

  it('should return 0 for today when no records', () => {
    expect(getTodayTotal()).toBe(0);
    expect(getTodayRounds()).toBe(0);
  });
});
