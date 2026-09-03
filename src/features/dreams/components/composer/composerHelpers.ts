/** Today's date as YYYY-MM-DD in local time. */
export function getTodayDate() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Adds a value to a multi-select, or removes it if already chosen. */
export function toggleSelection<T extends string>(values: T[], nextValue: T) {
  return values.includes(nextValue)
    ? values.filter(value => value !== nextValue)
    : [...values, nextValue];
}

export function formatLocalAssetName(path?: string) {
  if (!path) {
    return undefined;
  }

  const segments = path.split(/[\\/]/);
  return segments[segments.length - 1] || path;
}

/**
 * Content identity: title, body, sleep date, audio. `onSave` records the saved
 * dream's signature; the autosave compares against it so a same-moment debounce
 * does not re-persist a draft of an already-saved dream.
 */
export function getComposerContentSignature(input: {
  title?: string;
  text?: string;
  sleepDate?: string;
  audioUri?: string;
}) {
  return JSON.stringify([
    input.title?.trim() ?? '',
    input.text?.trim() ?? '',
    input.sleepDate?.trim() ?? '',
    input.audioUri ?? null,
  ]);
}
