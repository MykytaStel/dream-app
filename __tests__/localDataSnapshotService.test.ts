import {
  APP_LOCALE_KEY,
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAMS_STORAGE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX,
  DREAM_PRACTICE_REMINDER_SETTINGS_KEY,
  REMINDER_SETTINGS_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../src/services/storage/keys';
import { parseLocalDataSnapshot } from '../src/features/settings/services/localDataSnapshotService';

const fixedKeys = [
  DREAMS_STORAGE_KEY,
  DREAMS_INDEX_STORAGE_KEY,
  DREAMS_META_STORAGE_KEY,
  DREAM_DELETION_TOMBSTONES_STORAGE_KEY,
  DREAM_DRAFT_STORAGE_KEY,
  APP_LOCALE_KEY,
  DREAM_ANALYSIS_SETTINGS_KEY,
  REMINDER_SETTINGS_KEY,
  DREAM_PRACTICE_REMINDER_SETTINGS_KEY,
  REVIEW_SAVED_STATE_STORAGE_KEY,
  STORAGE_SCHEMA_VERSION_KEY,
];

function snapshot() {
  return {
    fixedValues: fixedKeys.map(key => ({
      key,
      value: { type: 'missing' as const },
    })),
    editDraftValues: [
      {
        key: `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`,
        value: { type: 'string' as const, value: '{"title":"Draft"}' },
      },
    ],
    dreamsReadable: true,
    tombstonesReadable: true,
    draftReadable: true,
    locale: 'uk',
    analysisSettings: { enabled: false },
    reminderSettings: { enabled: false },
    practiceReminderSettings: { enabled: false },
  };
}

describe('local data snapshot validation', () => {
  test('accepts the exact fixed-key set and app-owned edit draft prefix', () => {
    expect(parseLocalDataSnapshot(snapshot())).toMatchObject({
      locale: 'uk',
      fixedValues: expect.arrayContaining([
        expect.objectContaining({ key: DREAMS_STORAGE_KEY }),
        expect.objectContaining({ key: STORAGE_SCHEMA_VERSION_KEY }),
      ]),
      editDraftValues: [
        expect.objectContaining({
          key: `${DREAM_EDIT_DRAFT_STORAGE_KEY_PREFIX}dream-1`,
        }),
      ],
    });
  });

  test('rejects a snapshot that omits one fixed transaction key', () => {
    const value = snapshot();
    value.fixedValues = value.fixedValues.slice(1);

    expect(() => parseLocalDataSnapshot(value)).toThrow(/every fixed key/);
  });

  test('rejects an unknown fixed key even when all normal keys are present', () => {
    const value = snapshot();
    value.fixedValues.push({
      key: 'cloud-session',
      value: { type: 'missing' },
    });

    expect(() => parseLocalDataSnapshot(value)).toThrow(/unsafe fixed key/);
  });

  test('rejects an edit draft entry outside the owned prefix', () => {
    const value = snapshot();
    value.editDraftValues = [
      {
        key: 'dreams',
        value: { type: 'string', value: '[]' },
      },
    ];

    expect(() => parseLocalDataSnapshot(value)).toThrow(
      /unsafe edit draft key/,
    );
  });

  test('rejects mismatched stored value types', () => {
    const value = snapshot();
    value.fixedValues[0] = {
      key: DREAMS_STORAGE_KEY,
      value: { type: 'number', value: 'not-a-number' } as never,
    };

    expect(() => parseLocalDataSnapshot(value)).toThrow(/mismatched/);
  });
});
