import React from 'react';
import type {
  Dream,
  LucidControlArea,
  LucidPractice,
  LucidPracticeTechnique,
  LucidStabilizationAction,
} from '../../model/dream';

/**
 * The lucid practice answers, kept together with the record they become.
 *
 * The counterpart of `useNightmareFields`, and for the same reason: six pieces
 * of state that are one `LucidPractice` in the model, seeded in one place,
 * returned in another and reassembled in a third.
 *
 * One field here is not stored as it is typed. Dream signs are a comma-separated
 * line while being edited and a deduplicated list once saved, so the raw text and
 * the parsed list both live here — splitting them across two files would put the
 * parsing rule somewhere that cannot see the input it parses.
 */

export type LucidPracticeDraftSeed = {
  lucidTechnique?: LucidPracticeTechnique;
  dreamSigns?: string[];
  lucidTrigger?: string;
  controlAreas?: LucidControlArea[];
  stabilizationActions?: LucidStabilizationAction[];
  recallScore?: 1 | 2 | 3 | 4 | 5;
};

export function hasLucidPracticeValues(input: LucidPracticeDraftSeed) {
  return (
    Boolean(input.lucidTechnique) ||
    Boolean(input.dreamSigns?.length) ||
    Boolean(input.lucidTrigger?.trim()) ||
    Boolean(input.controlAreas?.length) ||
    Boolean(input.stabilizationActions?.length) ||
    typeof input.recallScore === 'number'
  );
}

export function useLucidPracticeFields(
  initialDream?: Dream,
  initialDraft?: LucidPracticeDraftSeed | null,
) {
  const [lucidTechnique, setLucidTechnique] = React.useState<
    LucidPracticeTechnique | undefined
  >(initialDream?.lucidPractice?.technique ?? initialDraft?.lucidTechnique);
  const [dreamSignsInput, setDreamSignsInput] = React.useState(
    (
      initialDream?.lucidPractice?.dreamSigns ??
      initialDraft?.dreamSigns ??
      []
    ).join(', '),
  );
  const [lucidTrigger, setLucidTrigger] = React.useState(
    initialDream?.lucidPractice?.trigger ?? initialDraft?.lucidTrigger ?? '',
  );
  const [controlAreas, setControlAreas] = React.useState<LucidControlArea[]>(
    initialDream?.lucidPractice?.controlAreas ??
      initialDraft?.controlAreas ??
      [],
  );
  const [stabilizationActions, setStabilizationActions] = React.useState<
    LucidStabilizationAction[]
  >(
    initialDream?.lucidPractice?.stabilizationActions ??
      initialDraft?.stabilizationActions ??
      [],
  );
  const [recallScore, setRecallScore] = React.useState<
    1 | 2 | 3 | 4 | 5 | undefined
  >(initialDream?.lucidPractice?.recallScore ?? initialDraft?.recallScore);

  /** The comma-separated line, parsed and deduplicated. */
  const dreamSigns = React.useMemo(
    () =>
      Array.from(
        new Set(
          dreamSignsInput
            .split(',')
            .map(value => value.trim())
            .filter(Boolean),
        ),
      ),
    [dreamSignsInput],
  );

  const lucidPracticeDraftValues: LucidPracticeDraftSeed = {
    lucidTechnique,
    dreamSigns,
    lucidTrigger,
    controlAreas,
    stabilizationActions,
    recallScore,
  };

  /** The record to save, or nothing when none of it was answered. */
  const buildLucidPractice = React.useCallback(():
    LucidPractice | undefined => {
    if (
      !hasLucidPracticeValues({
        lucidTechnique,
        dreamSigns,
        lucidTrigger,
        controlAreas,
        stabilizationActions,
        recallScore,
      })
    ) {
      return undefined;
    }

    return {
      technique: lucidTechnique,
      dreamSigns: dreamSigns.length ? dreamSigns : undefined,
      trigger: lucidTrigger.trim() || undefined,
      controlAreas: controlAreas.length ? controlAreas : undefined,
      stabilizationActions: stabilizationActions.length
        ? stabilizationActions
        : undefined,
      recallScore,
    };
  }, [
    controlAreas,
    dreamSigns,
    lucidTechnique,
    lucidTrigger,
    recallScore,
    stabilizationActions,
  ]);

  return {
    lucidTechnique,
    setLucidTechnique,
    dreamSignsInput,
    setDreamSignsInput,
    dreamSigns,
    lucidTrigger,
    setLucidTrigger,
    controlAreas,
    setControlAreas,
    stabilizationActions,
    setStabilizationActions,
    recallScore,
    setRecallScore,
    buildLucidPractice,
    lucidPracticeDraftValues,
  };
}
