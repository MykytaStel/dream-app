import notifee, { AuthorizationStatus } from '@notifee/react-native';
import { kv } from '../src/services/storage/mmkv';
import {
  applyDreamReminderSettings,
  getDreamReminderSettings,
  saveDreamReminderSettings,
  syncDreamReminderState,
} from '../src/features/reminders/services/dreamReminderService';

describe('dream reminder service', () => {
  beforeEach(() => {
    kv.clearAll();
    jest.clearAllMocks();
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.AUTHORIZED,
    });
  });

  test('keeps enabled reminder and schedules it when notifications are allowed', async () => {
    const applied = await applyDreamReminderSettings({
      enabled: true,
      hour: 8,
      minute: 30,
      style: 'gentle',
    });

    expect(applied).toEqual({
      enabled: true,
      hour: 8,
      minute: 30,
      style: 'gentle',
    });
    expect(getDreamReminderSettings()).toEqual(applied);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(1);
    expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Keep the dream close',
        body: 'A few calm words now can save the feeling before the day gets loud.',
        data: expect.objectContaining({
          target: 'record',
          style: 'gentle',
        }),
      }),
      expect.any(Object),
    );
  });

  test('disables persisted reminder when notifications are blocked', async () => {
    saveDreamReminderSettings({
      enabled: true,
      hour: 7,
      minute: 0,
      style: 'balanced',
    });
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
    });

    const applied = await syncDreamReminderState();

    expect(applied).toEqual({
      enabled: false,
      hour: 7,
      minute: 0,
      style: 'balanced',
    });
    expect(getDreamReminderSettings()).toEqual(applied);
    expect(notifee.cancelNotification).toHaveBeenCalled();
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  test('defaults missing reminder style to balanced when reading legacy settings', () => {
    kv.set(
      'dream-reminder-settings',
      JSON.stringify({
        enabled: true,
        hour: 6,
        minute: 45,
      }),
    );

    expect(getDreamReminderSettings()).toEqual({
      enabled: true,
      hour: 6,
      minute: 45,
      style: 'balanced',
    });
  });
});
