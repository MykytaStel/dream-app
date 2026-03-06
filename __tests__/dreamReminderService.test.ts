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
    });

    expect(applied).toEqual({
      enabled: true,
      hour: 8,
      minute: 30,
    });
    expect(getDreamReminderSettings()).toEqual(applied);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(1);
  });

  test('disables persisted reminder when notifications are blocked', async () => {
    saveDreamReminderSettings({
      enabled: true,
      hour: 7,
      minute: 0,
    });
    (notifee.getNotificationSettings as jest.Mock).mockResolvedValue({
      authorizationStatus: AuthorizationStatus.DENIED,
    });

    const applied = await syncDreamReminderState();

    expect(applied).toEqual({
      enabled: false,
      hour: 7,
      minute: 0,
    });
    expect(getDreamReminderSettings()).toEqual(applied);
    expect(notifee.cancelNotification).toHaveBeenCalled();
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });
});
