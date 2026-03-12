import { type DreamDetailFocusSection } from '../../../app/navigation/routes';
import { type DreamCopy } from '../../../constants/copy/dreams';
import { type Dream } from './dream';
import { countDreamWords } from './dreamAnalytics';

export type PostSaveFollowUp = {
  actionLabel: string;
  description: string;
  focusSection: DreamDetailFocusSection;
  icon: string;
  key: 'transcript' | 'refine' | 'reflection';
  title: string;
};

const REFINE_WORD_THRESHOLD = 12;

function createTranscriptFollowUp(copy: DreamCopy): PostSaveFollowUp {
  return {
    key: 'transcript',
    actionLabel: copy.postSaveFollowUpTranscriptAction,
    description: copy.postSaveFollowUpTranscriptDescription,
    focusSection: 'transcript',
    icon: 'document-text-outline',
    title: copy.postSaveFollowUpTranscriptTitle,
  };
}

function createRefineFollowUp(copy: DreamCopy): PostSaveFollowUp {
  return {
    key: 'refine',
    actionLabel: copy.postSaveFollowUpRefineAction,
    description: copy.postSaveFollowUpRefineDescription,
    focusSection: 'written',
    icon: 'create-outline',
    title: copy.postSaveFollowUpRefineTitle,
  };
}

function createReflectionFollowUp(copy: DreamCopy): PostSaveFollowUp {
  return {
    key: 'reflection',
    actionLabel: copy.postSaveFollowUpReflectionAction,
    description: copy.postSaveFollowUpReflectionDescription,
    focusSection: 'reflection',
    icon: 'sparkles-outline',
    title: copy.postSaveFollowUpReflectionTitle,
  };
}

export function getPostSaveFollowUps(
  dream: Dream | null,
  copy: DreamCopy,
): PostSaveFollowUp[] {
  const followUps: PostSaveFollowUp[] = [];
  const hasAudio = Boolean(dream?.audioUri);
  const transcript = dream?.transcript?.trim();
  const textWordCount = countDreamWords(dream?.text);
  const hasRawText = Boolean(dream?.text?.trim());
  const needsTranscript = hasAudio && (!transcript || dream?.transcriptStatus === 'error');
  const needsRefine = !hasRawText || textWordCount < REFINE_WORD_THRESHOLD;

  if (needsTranscript) {
    followUps.push(createTranscriptFollowUp(copy));
  }

  if (needsRefine) {
    followUps.push(createRefineFollowUp(copy));
  }

  if (!followUps.length || (followUps.length === 1 && hasRawText)) {
    followUps.push(createReflectionFollowUp(copy));
  }

  return followUps.slice(0, 2);
}
