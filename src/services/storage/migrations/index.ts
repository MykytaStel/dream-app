import { reportError } from '../../observability/errorReporting';
import {
  CURRENT_STORAGE_SCHEMA_VERSION,
  STORAGE_SCHEMA_VERSION_KEY,
} from '../keys';
import { kv } from '../mmkv';
import {
  UnreadableDreamStoreError,
  migrateDreamsFromLegacyShape,
} from './legacyDream';
import {
  migrateAnalysisSettingsToV5,
  migrateLocaleToV2,
  migrateReminderSettingsToV2,
} from './reminderLocale';
import { migrateReviewSavedStateToV9 } from './reviewSavedState';

export { UnreadableDreamStoreError };

function migrateDreamsToV2() {
  migrateDreamsFromLegacyShape();
}

function migrateToV2() {
  migrateDreamsToV2();
  migrateReminderSettingsToV2();
  migrateLocaleToV2();
}

function migrateDreamsToV3() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV4() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV5() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV6() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV7() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV8() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV10() {
  migrateDreamsFromLegacyShape();
}

function migrateDreamsToV12() {
  migrateDreamsFromLegacyShape();
}

function readStorageSchemaVersion() {
  const numericValue = kv.getNumber(STORAGE_SCHEMA_VERSION_KEY);
  if (typeof numericValue === 'number' && Number.isFinite(numericValue)) {
    return Math.max(1, Math.floor(numericValue));
  }

  const rawStringValue = kv.getString(STORAGE_SCHEMA_VERSION_KEY);
  if (typeof rawStringValue === 'string' && rawStringValue.trim()) {
    const parsed = Number(rawStringValue.trim());
    if (Number.isFinite(parsed)) {
      return Math.max(1, Math.floor(parsed));
    }
  }

  return 1;
}

export function runStorageMigrations() {
  try {
    return runStorageMigrationSteps();
  } catch (error) {
    if (error instanceof UnreadableDreamStoreError) {
      // The stored value is left exactly as it was, and the schema version is
      // not advanced, so the next launch tries again instead of treating the
      // unreadable data as already migrated.
      reportError(error, { event: 'storage_migration_aborted' });
      return readStorageSchemaVersion();
    }

    throw error;
  }
}

function runStorageMigrationSteps() {
  const currentVersion = readStorageSchemaVersion();
  if (currentVersion >= CURRENT_STORAGE_SCHEMA_VERSION) {
    return currentVersion;
  }

  let nextVersion = currentVersion;

  if (nextVersion < 2) {
    migrateToV2();
    nextVersion = 2;
  }

  if (nextVersion < 3) {
    migrateDreamsToV3();
    nextVersion = 3;
  }

  if (nextVersion < 4) {
    migrateDreamsToV4();
    nextVersion = 4;
  }

  if (nextVersion < 5) {
    migrateDreamsToV5();
    migrateAnalysisSettingsToV5();
    nextVersion = 5;
  }

  if (nextVersion < 6) {
    migrateDreamsToV6();
    nextVersion = 6;
  }

  if (nextVersion < 7) {
    migrateDreamsToV7();
    nextVersion = 7;
  }

  if (nextVersion < 8) {
    migrateDreamsToV8();
    nextVersion = 8;
  }

  if (nextVersion < 9) {
    migrateReviewSavedStateToV9();
    nextVersion = 9;
  }

  if (nextVersion < 10) {
    migrateDreamsToV10();
    nextVersion = 10;
  }

  if (nextVersion < 11) {
    // No-op: adds LAST_STREAK_CELEBRATED_KEY (missing = 0, correct default)
    nextVersion = 11;
  }

  if (nextVersion < 12) {
    migrateDreamsToV12();
    nextVersion = 12;
  }

  kv.set(STORAGE_SCHEMA_VERSION_KEY, nextVersion);
  return nextVersion;
}
