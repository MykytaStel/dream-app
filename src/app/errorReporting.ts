import { reportActionError } from '../services/observability/errorReporting';

/**
 * Logs user-facing action errors so they are visible in dev and not silently ignored.
 * Use in .catch() for critical flows (backup, export, restore, recording, etc.).
 */
export function logActionError(context: string, error: unknown): void {
  reportActionError(context, error);
}
