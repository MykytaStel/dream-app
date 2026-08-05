import React from 'react';
import { useI18n } from '../../../i18n/I18nProvider';
import {
  getDreamDraftRecoveryNoticeCopy,
  isDreamDraftRecoveryNoticeStatus,
} from '../model/dreamDraftRecoveryPresentation';
import {
  readDreamDraftForRecovery,
  readDreamEditDraftForRecovery,
  type DreamDraftRecoveryResult,
} from '../services/dreamDraftRecoveryService';
import { DreamComposer } from './DreamComposer';
import type { DreamComposerProps } from './DreamComposer.types';
import { DreamDraftRecoveryToast } from './DreamDraftRecoveryToast';

const MISSING_RECOVERY_RESULT: DreamDraftRecoveryResult = {
  status: 'missing',
  draft: null,
};

function readRecoveryResult({
  mode,
  initialDream,
}: Pick<DreamComposerProps, 'mode' | 'initialDream'>) {
  if (mode === 'create') {
    return readDreamDraftForRecovery();
  }

  if (!initialDream) {
    return MISSING_RECOVERY_RESULT;
  }

  return readDreamEditDraftForRecovery(
    initialDream.id,
    initialDream.updatedAt ?? initialDream.createdAt,
  );
}

/**
 * Resolves local draft recovery before DreamComposer reads its initial fields.
 *
 * A corrupt or stale key is removed during the lazy state initializer, then the
 * child composer mounts against clean storage. Valid drafts remain untouched and
 * are restored by the existing composer form without a second recovery policy.
 */
export function DreamComposerWithRecovery(props: DreamComposerProps) {
  const { locale } = useI18n();
  const [recoveryResult] = React.useState(() => readRecoveryResult(props));
  const [showNotice, setShowNotice] = React.useState(() =>
    isDreamDraftRecoveryNoticeStatus(recoveryResult.status),
  );
  const dismissNotice = React.useCallback(() => setShowNotice(false), []);

  const noticeCopy = React.useMemo(() => {
    if (!isDreamDraftRecoveryNoticeStatus(recoveryResult.status)) {
      return null;
    }

    return getDreamDraftRecoveryNoticeCopy(locale, recoveryResult.status);
  }, [locale, recoveryResult.status]);

  return (
    <>
      <DreamComposer {...props} />
      {showNotice && noticeCopy ? (
        <DreamDraftRecoveryToast
          title={noticeCopy.title}
          description={noticeCopy.description}
          dismissLabel={noticeCopy.dismissLabel}
          onDismiss={dismissNotice}
        />
      ) : null}
    </>
  );
}
