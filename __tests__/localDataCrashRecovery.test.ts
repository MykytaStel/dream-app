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
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY,
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
import { captureLocalDataSnapshot } from '../src/features/settings/services/localDataSnapshotService';
import {
  beginLocalDataTransactionJournal,
  markLocalDataTransactionCommitted,
  recoverInterruptedLocalDataTransaction,
} from '../src/features/settings/services/localDataTransactionJournalService';

const mockedGetLocale = jest.mocked(getStoredLocale);
const mockedSaveLocale = jest.mocked(saveLocale);
const mockedGetAnalysis = jest.mocked(getDreamAnalysisSettings);
const mockedSaveAnalysis = jest.mocked(saveDreamAnalysisSettings);
const mockedListDreams = jest.mocked(listDreams);
const mockedListTombstones = jest.mocked(listDreamDeletionTombstones);
const mockedGetDraft = jest.mocked(getDreamDraft);
const mockedGetReminder = jest.mocked(getDreamReminderSettings);
const mockedApplyReminder = jest.mocked(applyDreamReminderSettings);
const mockedGetPractice = jest.mocked(getDreamPracticeReminderSettings);
const mockedApplyPractice = jest.mocked(applyDreamPracticeReminderSettings);
const mockedScheduleWidget = jest.mocked(scheduleDreamWidgetSync);

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

describe('local data crash recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    kv.clearAll();
    mockedGetLocale.mockReturnValue('uk');
    mockedGetAnalysis.mockReturnValue(analysisSettings);
    mockedGetReminder.mockReturnValue(reminderSettings);
    mockedGetPractice.mockReturnValue(practiceSettings);
    mockedListDreams.mockReturnValue([]);
    mockedListTombstones.mockReturnValue([]);
    mockedGetDraft.mockReturnValue(null);
    mockedApplyReminder.mockResolvedValue(reminderSettings);
    mockedApplyPractice.mockResolvedValue(practiceSettings);
  });

  test('restores exact raw values after process termination during mutation', async () => {
    const editDraftKey = `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`;
    const originalDreams = ' [ { "id": "dream-1", "createdAt": 10 } ] ';
    const originalIndex = '[{"id":"dream-1","createdAt":10}]';
    const originalMeta = '{"totalCount":1}';
    const originalDraft = '{"title":"unfinished"}';

    kv.set(DREAMS_STORAGE_KEY, originalDreams);
    kv.set(DREAMS_INDEX_STORAGE_KEY, originalIndex);
    kv.set(DREAMS_META_STORAGE_KEY, originalMeta);
    kv.set(DREAM_DRAFT_STORAGE_KEY, originalDraft);
    kv.set(editDraftKey, '{"title":"before"}');
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 12);

    const journal = beginLocalDataTransactionJournal({
      label: 'dream-import-replace',
      checkpointFilePath: '/exports/recovery.json',
      snapshot: captureLocalDataSnapshot(),
    });

    kv.set(DREAMS_STORAGE_KEY, '[{"id":"new"}]');
    kv.set(DREAMS_INDEX_STORAGE_KEY, '[{"id":"new"}]');
    kv.remove(DREAMS_META_STORAGE_KEY);
    kv.remove(DREAM_DRAFT_STORAGE_KEY);
    kv.set(editDraftKey, '{"title":"changed"}');
    kv.set(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}new`, '{"title":"new"}');
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 99);

    expect(journal.phase).toBe('prepared');
    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeDefined();

    await expect(recoverInterruptedLocalDataTransaction()).resolves.toEqual({
      status: 'recovered',
      transactionLabel: 'dream-import-replace',
      checkpointCreated: true,
    });

    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe(originalDreams);
    expect(kv.getString(DREAMS_INDEX_STORAGE_KEY)).toBe(originalIndex);
    expect(kv.getString(DREAMS_META_STORAGE_KEY)).toBe(originalMeta);
    expect(kv.getString(DREAM_DRAFT_STORAGE_KEY)).toBe(originalDraft);
    expect(kv.getString(editDraftKey)).toBe('{"title":"before"}');
    expect(
      kv.getString(`${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}new`),
    ).toBeUndefined();
    expect(kv.getNumber(STORAGE_SCHEMA_VERSION_KEY)).toBe(12);
    expect(
      kv.getString(LOCAL_DATA_TRANSACTION_JOURNAL_STORAGE_KEY),
    ).toBeUndefined();

    expect(mockedListDreams).toHaveBeenCalled();
    expect(mockedListTombstones).toHaveBeenCalled();
    expect(mockedGetDraft).toHaveBeenCalled();
    expect(mockedSaveLocale).toHaveBeenCalledWith('uk');
    expect(mockedSaveAnalysis).toHaveBeenCalledWith(analysisSettings);
    expect(mockedApplyReminder).toHaveBeenCalledWith(reminderSettings);
    expect(mockedApplyPractice).toHaveBeenCalledWith(practiceSettings);
    expect(mockedScheduleWidget).toHaveBeenCalledTimes(1);
  });

  test('does not roll back data when the durable commit marker already exists', async () => {
    kv.set(DREAMS_STORAGE_KEY, '[{"id":"before"}]');
    kv.set(STORAGE_SCHEMA_VERSION_KEY, 12);
    const journal = beginLocalDataTransactionJournal({
      label: 'archive-health-repair',
      checkpointFilePath: null,
      snapshot: captureLocalDataSnapshot(),
    });

    kv.set(DREAMS_STORAGE_KEY, '[{"id":"after"}]');
    markLocalDataTransactionCommitted(journal.transactionId);

    await expect(recoverInterruptedLocalDataTransaction()).resolves.toEqual({
      status: 'committed-cleared',
      transactionLabel: 'archive-health-repair',
      checkpointCreated: false,
    });

    expect(kv.getString(DREAMS_STORAGE_KEY)).toBe('[{"id":"after"}]');
    expect(mockedSaveLocale).not.toHaveBeenCalled();
    expect(mockedApplyReminder).not.toHaveBeenCalled();
  });
});
