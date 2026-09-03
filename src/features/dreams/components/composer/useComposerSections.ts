import React from 'react';
import type { Dream } from '../../model/dream';
import type { DreamDraft } from '../../services/dreamDraftService';
import type { DreamComposerMode } from '../DreamComposer.types';
import { hasSleepContextValues } from './useSleepContextFields';
import { hasLucidPracticeValues } from './useLucidPracticeFields';
import { hasNightmareValues } from './useNightmareFields';

type UseComposerSectionsArgs = {
  mode: DreamComposerMode;
  isWakeMode: boolean;
  initialDreamFields?: Dream;
  initialDraft?: DreamDraft | null;
  initialLucidity: Dream['lucidity'];
};

/**
 * Which optional sections start open, and the toggles that open the rest.
 *
 * Each section has its own rule: in a plain capture every optional section
 * starts closed except the meta one, an edit opens all of them because the
 * answers already exist, and the wake flow forces the mood section open.
 * Collapsing these into one generic record would lose that.
 */
export function useComposerSections({
  mode,
  isWakeMode,
  initialDreamFields,
  initialDraft,
  initialLucidity,
}: UseComposerSectionsArgs) {
  const initialHasMoodDetails =
    Boolean(initialDreamFields?.mood ?? initialDraft?.mood) ||
    Boolean(
      initialDreamFields?.dreamIntensity ?? initialDraft?.dreamIntensity,
    ) ||
    Boolean(
      initialDreamFields?.wakeEmotions?.length ??
      initialDraft?.wakeEmotions?.length,
    ) ||
    typeof initialLucidity === 'number';
  const initialHasContextDetails = hasSleepContextValues({
    stressLevel:
      initialDreamFields?.sleepContext?.stressLevel ??
      initialDraft?.stressLevel,
    preSleepEmotions:
      initialDreamFields?.sleepContext?.preSleepEmotions ??
      initialDraft?.preSleepEmotions,
    alcoholTaken:
      initialDreamFields?.sleepContext?.alcoholTaken ??
      initialDraft?.alcoholTaken,
    caffeineLate:
      initialDreamFields?.sleepContext?.caffeineLate ??
      initialDraft?.caffeineLate,
    medications:
      initialDreamFields?.sleepContext?.medications ??
      initialDraft?.medications,
    importantEvents:
      initialDreamFields?.sleepContext?.importantEvents ??
      initialDraft?.importantEvents,
    healthNotes:
      initialDreamFields?.sleepContext?.healthNotes ??
      initialDraft?.healthNotes,
  });
  const initialHasTags = Boolean(
    initialDreamFields?.tags?.length ?? initialDraft?.tags?.length,
  );
  const initialHasLucidPractice = hasLucidPracticeValues({
    lucidTechnique:
      initialDreamFields?.lucidPractice?.technique ??
      initialDraft?.lucidTechnique,
    dreamSigns:
      initialDreamFields?.lucidPractice?.dreamSigns ?? initialDraft?.dreamSigns,
    lucidTrigger:
      initialDreamFields?.lucidPractice?.trigger ?? initialDraft?.lucidTrigger,
    controlAreas:
      initialDreamFields?.lucidPractice?.controlAreas ??
      initialDraft?.controlAreas,
    stabilizationActions:
      initialDreamFields?.lucidPractice?.stabilizationActions ??
      initialDraft?.stabilizationActions,
    recallScore:
      initialDreamFields?.lucidPractice?.recallScore ??
      initialDraft?.recallScore,
  });
  const initialHasNightmare = hasNightmareValues({
    nightmareExplicit:
      initialDreamFields?.nightmare?.explicit ??
      initialDraft?.nightmareExplicit,
    nightmareDistress:
      initialDreamFields?.nightmare?.distress ??
      initialDraft?.nightmareDistress,
    nightmareRecurring:
      initialDreamFields?.nightmare?.recurring ??
      initialDraft?.nightmareRecurring,
    nightmareRecurringKey:
      initialDreamFields?.nightmare?.recurringKey ??
      initialDraft?.nightmareRecurringKey,
    nightmareWokeFromDream:
      initialDreamFields?.nightmare?.wokeFromDream ??
      initialDraft?.nightmareWokeFromDream,
    nightmareAftereffects:
      initialDreamFields?.nightmare?.aftereffects ??
      initialDraft?.nightmareAftereffects,
    nightmareGroundingUsed:
      initialDreamFields?.nightmare?.groundingUsed ??
      initialDraft?.nightmareGroundingUsed,
    nightmareRewrittenEnding:
      initialDreamFields?.nightmare?.rewrittenEnding ??
      initialDraft?.nightmareRewrittenEnding,
    nightmareRescriptStatus:
      initialDreamFields?.nightmare?.rescriptStatus ??
      initialDraft?.nightmareRescriptStatus,
  });

  const [showMoodSection, setShowMoodSection] = React.useState(
    isWakeMode || mode === 'edit' || initialHasMoodDetails,
  );
  const [showContextSection, setShowContextSection] = React.useState(
    mode === 'edit' || initialHasContextDetails,
  );
  const [showTagsSection, setShowTagsSection] = React.useState(
    mode === 'edit' || initialHasTags,
  );
  const [showLucidPracticeSection, setShowLucidPracticeSection] =
    React.useState(mode === 'edit' || initialHasLucidPractice);
  const [showNightmareSection, setShowNightmareSection] = React.useState(
    mode === 'edit' || initialHasNightmare,
  );
  const [showMetaSection, setShowMetaSection] = React.useState(
    mode === 'edit' || !isWakeMode,
  );

  React.useEffect(() => {
    if (!isWakeMode) {
      return;
    }

    setShowMoodSection(true);
  }, [isWakeMode]);

  const resetSections = React.useCallback(() => {
    setShowMoodSection(isWakeMode);
    setShowContextSection(false);
    setShowTagsSection(false);
    setShowLucidPracticeSection(false);
    setShowNightmareSection(false);
    setShowMetaSection(!isWakeMode);
  }, [isWakeMode]);

  return {
    showMoodSection,
    setShowMoodSection,
    showContextSection,
    setShowContextSection,
    showTagsSection,
    setShowTagsSection,
    showLucidPracticeSection,
    setShowLucidPracticeSection,
    showNightmareSection,
    setShowNightmareSection,
    showMetaSection,
    setShowMetaSection,
    resetSections,
  };
}
