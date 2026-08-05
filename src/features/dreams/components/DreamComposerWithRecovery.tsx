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

type RecoverySession = {
  key: string;
  result: DreamDraftRecoveryResult;
};

function getRecoverySessionKey({
  mode,
  initialDream,
}: Pick<DreamComposerProps, 'mode' | 'initialDream'>) {
  if (mode === 'create') {
    return 'create';
  }

  if (!initialDream) {
    return 'edit:missing';
  }

  return `edit:${initialDream.id}:${
    initialDream.updatedAt ?? initialDream.createdAt
  }`;
}

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
 * The first render deliberately mounts no composer. The layout effect performs
 * the storage recovery, then the child mounts against clean storage before the
 * frame is presented. This keeps MMKV writes out of render and remains safe
 * when React Strict Mode repeats render-phase work in development.
 */
export function DreamComposerWithRecovery(props: DreamComposerProps) {
  const { locale } = useI18n();
  const sessionKey = getRecoverySessionKey(props);
  const [session, setSession] = React.useState<RecoverySession | null>(null);
  const [dismissedSessionKey, setDismissedSessionKey] = React.useState<
    string | null
  >(null);

  React.useLayoutEffect(() => {
    setSession({
      key: sessionKey,
      result: readRecoveryResult(props),
    });
  }, [
    props.initialDream,
    props.mode,
    sessionKey,
  ]);

  if (!session || session.key !== sessionKey) {
    return null;
  }

  const { result } = session;
  const noticeCopy = isDreamDraftRecoveryNoticeStatus(result.status)
    ? getDreamDraftRecoveryNoticeCopy(locale, result.status)
    : null;
  const showNotice = Boolean(
    noticeCopy && dismissedSessionKey !== sessionKey,
  );

  return (
    <>
      <DreamComposer {...props} />
      {showNotice && noticeCopy ? (
        <DreamDraftRecoveryToast
          title={noticeCopy.title}
          description={noticeCopy.description}
          dismissLabel={noticeCopy.dismissLabel}
          onDismiss={() => setDismissedSessionKey(sessionKey)}
        />
      ) : null}
    </>
  );
}
