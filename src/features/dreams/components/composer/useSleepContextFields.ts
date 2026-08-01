import React from 'react';
import type {
  Dream,
  PreSleepEmotion,
  SleepContext,
  StressLevel,
} from '../../model/dream';

/**
 * What the night before was like, kept together with the record it becomes.
 *
 * The third of the three groups the composer had flattened — see
 * `useNightmareFields` for why. This one is the closest to its model type:
 * the draft stores the same seven names `SleepContext` uses, so the seed shape
 * and the saved shape are the same shape, and the only work in between is
 * trimming.
 */

export function hasSleepContextValues(context: SleepContext) {
  return (
    typeof context.stressLevel === 'number' ||
    Boolean(context.preSleepEmotions?.length) ||
    typeof context.alcoholTaken === 'boolean' ||
    typeof context.caffeineLate === 'boolean' ||
    Boolean(context.medications?.trim()) ||
    Boolean(context.importantEvents?.trim()) ||
    Boolean(context.healthNotes?.trim())
  );
}

export function useSleepContextFields(
  initialDream?: Dream,
  initialDraft?: SleepContext | null,
) {
  const [stressLevel, setStressLevel] = React.useState<StressLevel | undefined>(
    initialDream?.sleepContext?.stressLevel ?? initialDraft?.stressLevel,
  );
  const [preSleepEmotions, setPreSleepEmotions] = React.useState<
    PreSleepEmotion[]
  >(
    initialDream?.sleepContext?.preSleepEmotions ??
      initialDraft?.preSleepEmotions ??
      [],
  );
  const [alcoholTaken, setAlcoholTaken] = React.useState<boolean | undefined>(
    initialDream?.sleepContext?.alcoholTaken ?? initialDraft?.alcoholTaken,
  );
  const [caffeineLate, setCaffeineLate] = React.useState<boolean | undefined>(
    initialDream?.sleepContext?.caffeineLate ?? initialDraft?.caffeineLate,
  );
  const [medications, setMedications] = React.useState(
    initialDream?.sleepContext?.medications ?? initialDraft?.medications ?? '',
  );
  const [importantEvents, setImportantEvents] = React.useState(
    initialDream?.sleepContext?.importantEvents ??
      initialDraft?.importantEvents ??
      '',
  );
  const [healthNotes, setHealthNotes] = React.useState(
    initialDream?.sleepContext?.healthNotes ?? initialDraft?.healthNotes ?? '',
  );

  const sleepContextDraftValues: SleepContext = {
    stressLevel,
    preSleepEmotions,
    alcoholTaken,
    caffeineLate,
    medications,
    importantEvents,
    healthNotes,
  };

  /**
   * The record to save, or nothing when none of it was answered.
   *
   * The three free-text fields are trimmed here and dropped when only
   * whitespace remains, so a field someone tabbed through does not become a
   * stored empty string that later reads as "they said nothing" rather than
   * "they were never asked".
   */
  const buildSleepContext = React.useCallback((): SleepContext | undefined => {
    const context: SleepContext = {
      stressLevel,
      preSleepEmotions: preSleepEmotions.length ? preSleepEmotions : undefined,
      alcoholTaken,
      caffeineLate,
      medications: medications.trim() || undefined,
      importantEvents: importantEvents.trim() || undefined,
      healthNotes: healthNotes.trim() || undefined,
    };

    return hasSleepContextValues(context) ? context : undefined;
  }, [
    alcoholTaken,
    caffeineLate,
    healthNotes,
    importantEvents,
    medications,
    preSleepEmotions,
    stressLevel,
  ]);

  return {
    stressLevel,
    setStressLevel,
    preSleepEmotions,
    setPreSleepEmotions,
    alcoholTaken,
    setAlcoholTaken,
    caffeineLate,
    setCaffeineLate,
    medications,
    setMedications,
    importantEvents,
    setImportantEvents,
    healthNotes,
    setHealthNotes,
    buildSleepContext,
    sleepContextDraftValues,
  };
}
