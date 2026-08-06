jest.mock('../src/features/settings/services/dataExportService', () => ({
  exportDreamDataSnapshot: jest.fn(),
}));

jest.mock('../src/i18n/localeStore', () => ({
  getStoredLocale: jest.fn(),
  saveLocale: jest.fn(),
}));

jest.mock(
  '../src/features/analysis/services/dreamAnalysisSettingsService',
  () => ({
    getDreamAnalysisSettings: jest.fn(),
    saveDreamAnalysisSettings: jest.fn(),
  }),
);

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  listDreams: jest.fn(),
}));

jest.mock(
  '../src/features/dreams/repository/dreamDeletionTombstonesRepository',
  () => ({
    listDreamDeletionTombstones: jest.fn(),
  }),
);

jest.mock('../src/features/dreams/services/dreamDraftService', () => ({
  getDreamDraft: jest.fn(),
}));

jest.mock('../src/features/reminders/services/dreamReminderService', () => ({
  getDreamReminderSettings: jest.fn(),
  applyDreamReminderSettings: jest.fn(),
}));

jest.mock(
  '../src/features/reminders/services/dreamPracticeReminderService',
  () => ({
    getDreamPracticeReminderSettings: jest.fn(),
    applyDreamPracticeReminderSettings: jest.fn(),
  }),
);

jest.mock('../src/features/widgets/services/dreamWidgetSyncService', () => ({
  scheduleDreamWidgetSync: jest.fn(),
}));

jest.mock('../src/services/observability', () => ({
  observability: { trackEvent: jest.fn() },
}));

jest.mock('../src/services/observability/errorReporting', () => ({
  reportActionError: jest.fn(),
}));

import { getStoredLocale, saveLocale } from '../src/i18n/localeStore';
import {
  DREAMS_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { kv } from '../src/services/storage/mmkv';
import {
  getDreamAnalysisSettings,
  saveDreamAnalysisSettings,
} from '../src/features/analysis/services/dreamAnalysisSettingsService';
import { listDreams } from '../src/features/dreams/repository/dreamsRepository';
import { listDreamDeletionTombstones } from '../src/features/dreams/repository/dreamDeletionTombstonesRepository';
import { getDreamDraft } from '../src/features/dreams/services/dreamDraftService';
import {
  applyDreamReminderSettings,
  getDreamReminderSettings,
} from '../src/features/reminders/services/dreamReminderService';
import {
  applyDreamPracticeReminderSettings,
  getDreamPracticeReminderSettings,
} from '../src/features/reminders/services/dreamPracticeReminderService';
import { scheduleDreamWidgetSync } from '../src/features/widgets/services/dreamWidgetSyncService';
import { exportDreamDataSnapshot } from '../src/features/settings/services/dataExportService';
import {
  __unsafeResetLocalDataTransactionQueueForTests,
  LocalDataTransactionError,
  runLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionService';

const mockedExport = jest.mocked(exportDreamDataSnapshot);
const mockedGetLocale = jest.mocked(getStoredLocale);
const mockedSaveLocale = jest.mocked(saveLocale);
const mockedGetAnalysis = jest.mocked(getDreamAnalysisSettings);
const mockedSaveAnalysis = jest.mocked(saveDreamAnalysisSettings);
const mockedListDreams = jest.mocked(listDreams);
const mockedListTombstones = jest.mocked(listDreamDeletionTombstones);
const mockedGetDraft = jest.mocked(getDreamDraft);
const mockedGetReminders = jest.mocked(getDreamReminderSettings);
const mockedApplyReminders = jest.mocked(applyDreamReminderSettings);
const mockedGetPractice = jest.mocked(getDreamPracticeReminderSettings);
const mockedApplyPractice = jest.mocked(applyDreamPracticeReminderSettings);
const mockedScheduleWidget = jest.mocked(scheduleDreamWidgetSync);

const savedDream = {
  id: 'dream-1',
  title: 'Dream',
  text: 'Saved content',
  createdAt: 10,
  updatedAt: 10,
};

const analysisSettings = {
  enabled: false,
  provider: 'manual' as const,
  allowNetwork: false,
};

const reminderSettings = {
  enabled: false,
  hour: 8,
  minute: 0,
  style: 'balanced' as const,
};

const practiceSettings = {
  morning_capture: { enabled: false, hour: 7, minute: 15 },
  reality_checks: {
    enabled: false,
    startHour: 10,
    endHour: 18,
    intervalHours: 4,
  },
  evening_intention: { enabled: false, hour: 21, minute: 15 },
  wbtb: { enabled: false, hour: 4, minute: 30 },
};

describe('local data transaction service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    __unsafeResetLocalDataTransactionQueueForTests();
    kv.set(DREAMS_STORAGE_KEY, JSON.stringify([savedDream]));
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 12);
    mockedExport.mockResolvedValue({
      filePath: '/exports/recovery.json',
      payload: {} as never,
    });
    mockedGetLocale.mockReturnValue('uk');
    mockedGetAnalysis.mockReturnValue(analysisSettings);
    mockedListDreams.mockReturnValue([savedDream] as never);
    mockedListTombstones.mockReturnValue([]);
    mockedGetDraft.mockReturnValue(null);
    mockedGetReminders.mockReturnValue(reminderSettings);
    mockedGetPractice.mockReturnValue(practiceSettings);
    mockedApplyReminders.mockResolvedValue(reminderSettings);
    mockedApplyPractice.mockResolvedValue(practiceSettings);
  });

  test('restores raw state exactly and refreshes semantic side effects', async () => {
    const editKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`;
    const originalDreamsRaw = ' [ { "id": "dream-1", "createdAt": 10 } ] ';
    kv.set(DREAMS_STORAGE_KEY, originalDreamsRaw);
    kv.set(editKey, '{"title":"before"}');

    let caught: unknown;
    try {
      await runLocalDataTransaction(
        { label: 'restore-test', checkpointPolicy: 'required' },
        async () => {
          kv.set(DREAMS_STORAGE_KEY, '[{"id":"changed"}]');
          kv.set(editKey, '{"title":"changed"}');
          throw new Error('late reminder failure');
        },
      );
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(LocalDataTransactionError);
    expect(caught).toMatchObject({
      name: 'LocalDataTransactionError',
      checkpointFilePath: '/exports/recovery.json',
      rollbackError: undefined,
    });
    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(originalDreamsRaw);
    expect(kv.getString(editKey)).toBe('{"title":"before"}');
    expect(mockedListDreams).toHaveBeenCalled();
    expect(mockedListTombstones).toHaveBeenCalled();
    expect(mockedGetDraft).toHaveBeenCalled();
    expect(mockedSaveLocale).toHaveBeenCalledWith('uk');
    expect(mockedSaveAnalysis).toHaveBeenCalledWith(analysisSettings);
    expect(mockedApplyReminders).toHaveBeenCalledWith(reminderSettings);
    expect(mockedApplyPractice).toHaveBeenCalledWith(practiceSettings);
    expect(mockedScheduleWidget).toHaveBeenCalledTimes(1);
  });

  test('preserves an unreadable dream store byte-for-byte during rollback', async () => {
    kv.set(DREAMS_STORAGE_KEY, '{broken-json');

    await expect(
      runLocalDataTransaction(
        { label: 'unreadable-test', checkpointPolicy: 'best-effort' },
        async () => {
          kv.set(DREAMS_STORAGE_KEY, '[]');
          throw new Error('failed');
        },
      ),
    ).rejects.toBeInstanceOf(LocalDataTransactionError);

    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe('{broken-json');
    expect(mockedListDreams).not.toHaveBeenCalled();
    expect(mockedScheduleWidget).not.toHaveBeenCalled();
  });

  test('serializes archive-wide mutations instead of interleaving them', async () => {
    const releaseFirst: { current: (() => void) | null } = { current: null };
    const firstOperation = jest.fn(
      () =>
        new Promise<string>(resolve => {
          releaseFirst.current = () => resolve('first');
        }),
    );
    const secondOperation = jest.fn(async () => 'second');

    const first = runLocalDataTransaction(
      { label: 'first', checkpointPolicy: 'none' },
      firstOperation,
    );
    const second = runLocalDataTransaction(
      { label: 'second', checkpointPolicy: 'none' },
      secondOperation,
    );

    for (
      let tick = 0;
      tick < 10 && firstOperation.mock.calls.length === 0;
      tick++
    ) {
      await Promise.resolve();
    }
    expect(firstOperation).toHaveBeenCalledTimes(1);
    expect(secondOperation).not.toHaveBeenCalled();

    releaseFirst.current?.();
    await expect(first).resolves.toMatchObject({ value: 'first' });
    await expect(second).resolves.toMatchObject({ value: 'second' });
    expect(secondOperation).toHaveBeenCalledTimes(1);
  });
});
