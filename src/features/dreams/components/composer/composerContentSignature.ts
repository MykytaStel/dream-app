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
