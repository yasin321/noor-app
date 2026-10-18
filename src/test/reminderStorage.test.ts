import { describe, it, expect, beforeEach } from 'vitest';
import { saveReminder, loadReminders, deleteReminderFromStorage, clearAllReminders, generateReminderId } from '@/lib/reminderStorage';

describe('reminderStorage', () => {
  beforeEach(() => {
    clearAllReminders();
  });

  it('should generate unique ids', () => {
    const id1 = generateReminderId();
    const id2 = generateReminderId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^r_\d+_/);
  });

  it('should save and load a reminder', () => {
    const reminder = {
      id: 'test-1',
      title: 'ذکر صبح',
      body: '',
      time: '07:00',
      days: [0, 1, 2],
      enabled: true,
      dhikrId: 'subhanallah',
      type: 'recurring' as const,
      date: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveReminder(reminder);
    const loaded = loadReminders();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].title).toBe('ذکر صبح');
    expect(loaded[0].time).toBe('07:00');
  });

  it('should delete a reminder', () => {
    const reminder = {
      id: 'test-2',
      title: 'ذکر شب',
      body: '',
      time: '21:00',
      days: [5],
      enabled: true,
      dhikrId: null,
      type: 'recurring' as const,
      date: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    saveReminder(reminder);
    expect(loadReminders()).toHaveLength(1);
    deleteReminderFromStorage('test-2');
    expect(loadReminders()).toHaveLength(0);
  });

  it('should sort reminders by time', () => {
    const r1 = {
      id: 'r-late', title: 'عصر', body: '', time: '15:00',
      days: [], enabled: true, dhikrId: null, type: 'recurring' as const,
      date: null, createdAt: '', updatedAt: '',
    };
    const r2 = {
      id: 'r-early', title: 'صبح', body: '', time: '06:00',
      days: [], enabled: true, dhikrId: null, type: 'recurring' as const,
      date: null, createdAt: '', updatedAt: '',
    };
    saveReminder(r1);
    saveReminder(r2);
    const loaded = loadReminders();
    expect(loaded[0].time).toBe('06:00');
    expect(loaded[1].time).toBe('15:00');
  });

  it('should handle empty store', () => {
    expect(loadReminders()).toEqual([]);
  });
});
