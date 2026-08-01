import React from 'react';
import type {
  Dream,
  NightmareAftereffect,
  NightmareGroundingAction,
  NightmareRescriptStatus,
  NightmareSupport,
} from '../../model/dream';

/**
 * The nightmare answers, kept together with the record they become.
 *
 * `NightmareSupport` is one object in the model and was nine separate `useState`
 * calls in the composer, flattened on the way in and reassembled by hand at save
 * time nearly five hundred lines away. Every field appeared three times — seeding,
 * returning, assembling — and a tenth field would have had to be added to all
 * three by whoever remembered they existed.
 *
 * Nothing about the behaviour changes here. The same nine pieces of state, the
 * same seeding order, the same rule for when the record is worth saving at all.
 * What moves is where they live.
 */

/** The subset of a saved draft this cares about. */
export type NightmareDraftSeed = {
  nightmareExplicit?: boolean;
  nightmareDistress?: 1 | 2 | 3 | 4 | 5;
  nightmareRecurring?: boolean;
  nightmareRecurringKey?: string;
  nightmareWokeFromDream?: boolean;
  nightmareAftereffects?: NightmareAftereffect[];
  nightmareGroundingUsed?: NightmareGroundingAction[];
  nightmareRewrittenEnding?: string;
  nightmareRescriptStatus?: NightmareRescriptStatus;
};

/**
 * Whether anything here was answered.
 *
 * Exported because the seeding path needs the same question about the values it
 * is about to seed with — that is what decides whether the section starts open.
 */
export function hasNightmareValues(input: NightmareDraftSeed) {
  return (
    typeof input.nightmareExplicit === 'boolean' ||
    typeof input.nightmareDistress === 'number' ||
    typeof input.nightmareRecurring === 'boolean' ||
    Boolean(input.nightmareRecurringKey?.trim()) ||
    typeof input.nightmareWokeFromDream === 'boolean' ||
    Boolean(input.nightmareAftereffects?.length) ||
    Boolean(input.nightmareGroundingUsed?.length) ||
    Boolean(input.nightmareRewrittenEnding?.trim()) ||
    Boolean(input.nightmareRescriptStatus)
  );
}

export function useNightmareFields(
  initialDream?: Dream,
  // Null rather than undefined is what the draft store returns when there is
  // nothing saved, and translating that at every call site is noise.
  initialDraft?: NightmareDraftSeed | null,
) {
  const [nightmareExplicit, setNightmareExplicit] = React.useState<
    boolean | undefined
  >(initialDream?.nightmare?.explicit ?? initialDraft?.nightmareExplicit);
  const [nightmareDistress, setNightmareDistress] = React.useState<
    1 | 2 | 3 | 4 | 5 | undefined
  >(initialDream?.nightmare?.distress ?? initialDraft?.nightmareDistress);
  const [nightmareRecurring, setNightmareRecurring] = React.useState<
    boolean | undefined
  >(initialDream?.nightmare?.recurring ?? initialDraft?.nightmareRecurring);
  const [nightmareRecurringKey, setNightmareRecurringKey] = React.useState(
    initialDream?.nightmare?.recurringKey ??
      initialDraft?.nightmareRecurringKey ??
      '',
  );
  const [nightmareWokeFromDream, setNightmareWokeFromDream] = React.useState<
    boolean | undefined
  >(
    initialDream?.nightmare?.wokeFromDream ??
      initialDraft?.nightmareWokeFromDream,
  );
  const [nightmareAftereffects, setNightmareAftereffects] = React.useState<
    NightmareAftereffect[]
  >(
    initialDream?.nightmare?.aftereffects ??
      initialDraft?.nightmareAftereffects ??
      [],
  );
  const [nightmareGroundingUsed, setNightmareGroundingUsed] = React.useState<
    NightmareGroundingAction[]
  >(
    initialDream?.nightmare?.groundingUsed ??
      initialDraft?.nightmareGroundingUsed ??
      [],
  );
  const [nightmareRewrittenEnding, setNightmareRewrittenEnding] =
    React.useState(
      initialDream?.nightmare?.rewrittenEnding ??
        initialDraft?.nightmareRewrittenEnding ??
        '',
    );
  const [nightmareRescriptStatus, setNightmareRescriptStatus] = React.useState<
    NightmareRescriptStatus | undefined
  >(
    initialDream?.nightmare?.rescriptStatus ??
      initialDraft?.nightmareRescriptStatus,
  );

  /**
   * The record to save, or nothing.
   *
   * Undefined rather than an object of undefineds: a dream captured in ten
   * seconds should not carry an empty nightmare record for the rest of its life,
   * and every reader downstream already treats absence as "was not asked".
   */
  const buildNightmare = React.useCallback((): NightmareSupport | undefined => {
    const answers = {
      nightmareExplicit,
      nightmareDistress,
      nightmareRecurring,
      nightmareRecurringKey,
      nightmareWokeFromDream,
      nightmareAftereffects,
      nightmareGroundingUsed,
      nightmareRewrittenEnding,
      nightmareRescriptStatus,
    };

    if (!hasNightmareValues(answers)) {
      return undefined;
    }

    return {
      explicit: nightmareExplicit,
      distress: nightmareDistress,
      recurring: nightmareRecurring,
      recurringKey: nightmareRecurringKey.trim() || undefined,
      wokeFromDream: nightmareWokeFromDream,
      aftereffects: nightmareAftereffects.length
        ? nightmareAftereffects
        : undefined,
      groundingUsed: nightmareGroundingUsed.length
        ? nightmareGroundingUsed
        : undefined,
      rewrittenEnding: nightmareRewrittenEnding.trim() || undefined,
      rescriptStatus: nightmareRescriptStatus,
    };
  }, [
    nightmareAftereffects,
    nightmareDistress,
    nightmareExplicit,
    nightmareGroundingUsed,
    nightmareRecurring,
    nightmareRecurringKey,
    nightmareRescriptStatus,
    nightmareRewrittenEnding,
    nightmareWokeFromDream,
  ]);

  /** What the draft autosave stores, which is the flat shape it reads back. */
  const nightmareDraftValues: NightmareDraftSeed = {
    nightmareExplicit,
    nightmareDistress,
    nightmareRecurring,
    nightmareRecurringKey,
    nightmareWokeFromDream,
    nightmareAftereffects,
    nightmareGroundingUsed,
    nightmareRewrittenEnding,
    nightmareRescriptStatus,
  };

  return {
    nightmareExplicit,
    setNightmareExplicit,
    nightmareDistress,
    setNightmareDistress,
    nightmareRecurring,
    setNightmareRecurring,
    nightmareRecurringKey,
    setNightmareRecurringKey,
    nightmareWokeFromDream,
    setNightmareWokeFromDream,
    nightmareAftereffects,
    setNightmareAftereffects,
    nightmareGroundingUsed,
    setNightmareGroundingUsed,
    nightmareRewrittenEnding,
    setNightmareRewrittenEnding,
    nightmareRescriptStatus,
    setNightmareRescriptStatus,
    buildNightmare,
    nightmareDraftValues,
  };
}
