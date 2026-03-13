/**
 * Logs user-facing action errors so they are visible in dev and not silently ignored.
 * Use in .catch() for critical flows (backup, export, restore, recording, etc.).
 */
export function logActionError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.error(`[${context}]`, message, error);
  }
}
