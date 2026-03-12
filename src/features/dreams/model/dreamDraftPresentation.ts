import { type DreamCopy } from '../../../constants/copy/dreams';
import { type DreamDraftSnapshot } from '../services/dreamDraftService';

export function getDreamDraftSummaryLabels(
  snapshot: DreamDraftSnapshot | null,
  copy: DreamCopy,
) {
  if (!snapshot) {
    return [];
  }

  const labels: string[] = [];

  if (snapshot.hasAudio) {
    labels.push(copy.voiceTitle);
  }

  if (snapshot.wordCount > 0) {
    labels.push(`${snapshot.wordCount} ${copy.wordsUnit}`);
  }

  if (snapshot.resumeMode === 'wake') {
    labels.push(copy.wakeModeChip);
  } else if (snapshot.hasWakeSignals) {
    labels.push(copy.detailWakeEmotionsLabel);
  }

  if (snapshot.hasContext) {
    labels.push(copy.refineContextAction);
  }

  if (snapshot.hasTags) {
    labels.push(copy.refineTagsAction);
  }

  return Array.from(new Set(labels));
}

export function getDreamDraftResumeDescription(
  snapshot: DreamDraftSnapshot | null,
  copy: DreamCopy,
) {
  const labels = getDreamDraftSummaryLabels(snapshot, copy);
  return labels.length ? labels.slice(0, 3).join(' • ') : copy.quickAddContinueHint;
}
