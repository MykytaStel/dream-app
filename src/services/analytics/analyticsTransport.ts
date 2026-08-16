import type { AnalyticsEvent } from './analyticsEvent';

export type AnalyticsTransport = {
  /**
   * Resolves true when the batch was durably accepted and may be dropped
   * locally. Anything else — false, or a rejection — leaves the batch queued
   * for the next flush.
   */
  send(batch: AnalyticsEvent[]): Promise<boolean>;
};
