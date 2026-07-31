import React from 'react';
import {
  getArchiveKey,
  getArchiveRecoveryCode,
  importArchiveKeyFromRecoveryCode,
} from '../../../services/crypto/archiveKeyService';
import {
  getKeySyncAvailability,
  type KeySyncAvailability,
} from '../../../services/security/archiveKeyStorage';
import { isRecoveryCodeValid } from '../../../services/crypto/recoveryCode';
import { presentArchiveKey } from '../model/archiveKeyPresentation';
import { reportError } from '../../../services/observability/errorReporting';

/**
 * Wires the archive-key section to the services behind it.
 *
 * Everything that decides what the user sees lives in `presentArchiveKey`,
 * which is pure and tested. This hook only fetches, holds and forwards.
 */

const UNKNOWN_AVAILABILITY: KeySyncAvailability = {
  status: 'unavailable',
  reason: 'not-checked-yet',
};

export function useArchiveKeyController(lastSyncErrorMessage?: string) {
  const [availability, setAvailability] =
    React.useState<KeySyncAvailability>(UNKNOWN_AVAILABILITY);
  const [hasKey, setHasKey] = React.useState(false);
  const [recoveryCode, setRecoveryCode] = React.useState<string | null>(null);
  const [enteredCode, setEnteredCode] = React.useState('');
  const [entryFeedback, setEntryFeedback] = React.useState<
    'invalid' | 'accepted' | null
  >(null);
  const [isCheckingKey, setIsCheckingKey] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const [nextAvailability, key] = await Promise.all([
        getKeySyncAvailability(),
        getArchiveKey(),
      ]);

      setAvailability(nextAvailability);
      setHasKey(Boolean(key));
    } catch (error) {
      reportError(error, { event: 'archive_key_status_failed' });
    } finally {
      setIsCheckingKey(false);
    }
  }, []);

  React.useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const onToggleRecoveryCode = React.useCallback(async () => {
    if (recoveryCode) {
      setRecoveryCode(null);
      return;
    }

    try {
      setRecoveryCode(await getArchiveRecoveryCode());
    } catch (error) {
      reportError(error, { event: 'archive_recovery_code_failed' });
    }
  }, [recoveryCode]);

  const onSubmitRecoveryCode = React.useCallback(async () => {
    // Checked before import so a mistyped word is rejected without replacing
    // the key this device already holds.
    if (!isRecoveryCodeValid(enteredCode)) {
      setEntryFeedback('invalid');
      return;
    }

    try {
      await importArchiveKeyFromRecoveryCode(enteredCode);
      setEntryFeedback('accepted');
      setEnteredCode('');
      await refresh();
    } catch (error) {
      reportError(error, { event: 'archive_key_import_failed' });
      setEntryFeedback('invalid');
    }
  }, [enteredCode, refresh]);

  const onChangeEnteredCode = React.useCallback((value: string) => {
    setEnteredCode(value);
    setEntryFeedback(null);
  }, []);

  const presentation = React.useMemo(
    () => presentArchiveKey({ availability, hasKey, lastSyncErrorMessage }),
    [availability, hasKey, lastSyncErrorMessage],
  );

  return {
    presentation,
    // The section stays hidden until the check resolves rather than flashing
    // "no key yet" for a frame on every visit to the screen.
    isCheckingKey,
    recoveryCode,
    enteredCode,
    entryFeedback,
    onToggleRecoveryCode,
    onChangeEnteredCode,
    onSubmitRecoveryCode,
  };
}
