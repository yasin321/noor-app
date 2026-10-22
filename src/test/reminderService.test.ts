import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LocalNotifications } from '@capacitor/local-notifications';
import { getUpcomingOccurrences, scheduleReminder, type LocalReminder } from '@/lib/reminderService';

describe('reminderService scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 22, 8, 0, 0));
    vi.mocked(LocalNotifications.checkPermissions).mockResolvedValue({ display: 'granted' });
    vi.mocked(LocalNotifications.checkExactNotificationSetting).mockResolvedValue({ exact_alarm: 'granted' });
    vi.mocked(LocalNotifications.schedule).mockResolvedValue({ notifications: [] });
    vi.mocked(LocalNotifications.cancel).mockResolvedValue(undefined);
    vi.mocked(LocalNotifications.createChannel).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  const reminder: LocalReminder = {
    id: 'test-reminder',
    title: 'یادآوری آزمایشی',
    body: 'ذکر آرامش',
    time: '09:00',
    days: [0, 1, 2, 3, 4, 5, 6],
    enabled: true,
    dhikrId: null,
    type: 'recurring',
    date: null,
    createdAt: '2026-10-22T08:00:00.000Z',
    updatedAt: '2026-10-22T08:00:00.000Z',
  };

  it('calculates only future occurrences and rejects malformed times', () => {
    const from = new Date(2026, 9, 22, 8, 0, 0);
    const next = getUpcomingOccurrences('09:00', [0, 1, 2, 3, 4, 5, 6], from, 2);
    expect(next).toHaveLength(3);
    expect(next[0].getTime()).toBeGreaterThan(from.getTime());
    expect(getUpcomingOccurrences('not-a-time', [1], from)).toEqual([]);
  });

  it('schedules recurring notifications when notification and exact-alarm access are granted', async () => {
    const result = await scheduleReminder(reminder);
    expect(result.success).toBe(true);
    expect(result.scheduledIds).toHaveLength(15);
    expect(LocalNotifications.schedule).toHaveBeenCalledTimes(15);
    expect(LocalNotifications.checkExactNotificationSetting).toHaveBeenCalledTimes(1);
  });

  it('does not schedule when exact-alarm access is denied', async () => {
    vi.mocked(LocalNotifications.checkExactNotificationSetting).mockResolvedValue({ exact_alarm: 'denied' });
    const result = await scheduleReminder(reminder);
    expect(result.success).toBe(false);
    expect(result.error).toContain('آلارم‌ها و یادآوری‌ها');
    expect(LocalNotifications.schedule).not.toHaveBeenCalled();
  });
});
