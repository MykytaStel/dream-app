import * as events from '../src/services/observability/events';
import {
  DIAG_EVENTS,
  OBS_EVENTS,
  PRODUCT_EVENTS,
} from '../src/services/observability/events';
import {
  isKnownAnalyticsEvent,
  listKnownAnalyticsEvents,
  sanitizeProps,
} from '../src/services/analytics/analyticsEvent';

const mockTrackEvent = jest.fn();

jest.mock('../src/services/observability', () => ({
  observability: {
    trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
    captureError: jest.fn(),
    captureMessage: jest.fn(),
  },
}));

describe('analytics taxonomy', () => {
  it('namespaces every event as product or diag', () => {
    for (const name of Object.values(OBS_EVENTS)) {
      expect([name, /^(product|diag)\./.test(name)]).toEqual([name, true]);
    }
  });

  it('keeps the two namespaces disjoint', () => {
    const product = new Set<string>(Object.values(PRODUCT_EVENTS));

    for (const name of Object.values(DIAG_EVENTS)) {
      expect([name, product.has(name)]).toEqual([name, false]);
    }
  });

  it('declares every product event in the content guard', () => {
    for (const name of Object.values(PRODUCT_EVENTS)) {
      expect([name, isKnownAnalyticsEvent(name)]).toEqual([name, true]);
    }
  });

  it('declares no diag event in the content guard, so none reach the table', () => {
    for (const name of Object.values(DIAG_EVENTS)) {
      expect([name, isKnownAnalyticsEvent(name)]).toEqual([name, false]);
    }
  });

  it('has no guard entry the registry does not emit', () => {
    const registry = new Set<string>(Object.values(OBS_EVENTS));

    for (const name of listKnownAnalyticsEvents()) {
      expect([name, registry.has(name)]).toEqual([name, true]);
    }
  });

  it('covers every funnel step §9 names', () => {
    const required = [
      'product.onboarding_opened',
      'product.onboarding_completed',
      'product.capture_started',
      'product.dream_saved',
      'product.dream_detail_opened',
      'product.memory_opened',
      'product.pattern_opened',
      'product.pattern_confirmed',
      'product.backup_enabled',
    ];

    for (const name of required) {
      expect([name, isKnownAnalyticsEvent(name)]).toEqual([name, true]);
    }
  });
});

/**
 * The drift guard.
 *
 * The allowlist was first written from assumptions about what the track
 * helpers emit, and several entries were wrong — `entry_source` where the code
 * sends `source`, `dream_count` where it sends `imported_dream_count`. Nothing
 * failed: the guard silently dropped real properties, and the columns would
 * have been empty in the database months later.
 *
 * So rather than trusting the list, this calls every helper with a fully
 * populated input and asserts that nothing it emits is dropped. Renaming a
 * property on either side now fails here.
 */
describe('every property a track helper emits survives the guard', () => {
  const invocations: Array<[string, () => void]> = [
    ['trackOnboardingOpened', () => events.trackOnboardingOpened()],
    [
      'trackOnboardingCompleted',
      () => events.trackOnboardingCompleted({ path: 'voice' }),
    ],
    [
      'trackCaptureStarted',
      () =>
        events.trackCaptureStarted({
          captureId: 'c1',
          entryMode: 'voice',
          autoStartedRecording: true,
          source: 'manual',
        }),
    ],
    [
      'trackDraftResumed',
      () =>
        events.trackDraftResumed({
          resumeMode: 'voice',
          hasAudio: true,
          hasText: true,
          source: 'manual',
        }),
    ],
    [
      'trackDreamSaved',
      () =>
        events.trackDreamSaved({
          captureId: 'c1',
          mode: 'create',
          entryMode: 'voice',
          hasAudio: true,
          hasText: true,
          dreamIndex: 3,
        }),
    ],
    [
      'trackDreamDetailOpened',
      () => events.trackDreamDetailOpened({ dreamAgeDays: 21, source: 'home' }),
    ],
    ['trackMemoryOpened', () => events.trackMemoryOpened({ dreamCount: 12 })],
    ['trackPatternOpened', () => events.trackPatternOpened({ kind: 'symbol' })],
    [
      'trackPatternConfirmed',
      () => events.trackPatternConfirmed({ kind: 'symbol', action: 'confirm' }),
    ],
    [
      'trackSearchUsed',
      () =>
        events.trackSearchUsed({
          surface: 'archive',
          queryLength: 5,
          resultCount: 2,
        }),
    ],
    [
      'trackFiltersApplied',
      () => events.trackFiltersApplied({ surface: 'archive', filterCount: 2 }),
    ],
    [
      'trackReminderToggled',
      () => events.trackReminderToggled({ enabled: true }),
    ],
    [
      'trackBiometricLockToggled',
      () => events.trackBiometricLockToggled({ enabled: true }),
    ],
    ['trackBackupEnabled', () => events.trackBackupEnabled({ kind: 'cloud' })],
    ['trackBackupExportStarted', () => events.trackBackupExportStarted()],
    [
      'trackBackupExportCompleted',
      () => events.trackBackupExportCompleted({ dreamCount: 9 }),
    ],
    [
      'trackRestoreStarted',
      () => events.trackRestoreStarted({ mode: 'merge' }),
    ],
    [
      'trackRestoreCompleted',
      () =>
        events.trackRestoreCompleted({
          mode: 'merge',
          importedDreamCount: 4,
          resultingDreamCount: 9,
        }),
    ],
    [
      'trackPracticeHubOpened',
      () => events.trackPracticeHubOpened({ focus: 'lucid', source: 'home' }),
    ],
    [
      'trackLucidPracticeStarted',
      () => events.trackLucidPracticeStarted({ source: 'home' }),
    ],
    [
      'trackRealityCheckCompleted',
      () => events.trackRealityCheckCompleted({ source: 'home' }),
    ],
    ['trackWbtbAlarmUsed', () => events.trackWbtbAlarmUsed({ source: 'home' })],
    [
      'trackNightmareRescriptingStarted',
      () => events.trackNightmareRescriptingStarted({ source: 'home' }),
    ],
    [
      'trackNightmareRescriptingCompleted',
      () => events.trackNightmareRescriptingCompleted({ source: 'home' }),
    ],
    [
      'trackGroundingOpened',
      () => events.trackGroundingOpened({ source: 'home' }),
    ],
    [
      'trackDreamSignSaved',
      () => events.trackDreamSignSaved({ count: 2, source: 'home' }),
    ],
  ];

  it.each(invocations)('%s', (_name, invoke) => {
    mockTrackEvent.mockClear();

    invoke();

    expect(mockTrackEvent).toHaveBeenCalledTimes(1);
    const [event, context] = mockTrackEvent.mock.calls[0] as [
      string,
      Record<string, unknown> | undefined,
    ];

    const emitted = context ?? {};
    const survived = sanitizeProps(event, emitted);

    // Every key the helper actually sent must be declared for this event.
    expect([event, Object.keys(survived).sort()]).toEqual([
      event,
      Object.keys(emitted).sort(),
    ]);
  });

  it('exercises every product event the registry declares', () => {
    // Otherwise a new helper could be added, never listed above, and drift
    // right back in.
    const covered = new Set<string>();
    for (const [, invoke] of invocations) {
      mockTrackEvent.mockClear();
      invoke();
      covered.add(mockTrackEvent.mock.calls[0][0] as string);
    }

    const declared = Object.values(PRODUCT_EVENTS).filter(
      // trackAppOpened takes no input, so there is nothing for the drift
      // guard above to compare — it is covered by the registry tests instead.
      name => name !== PRODUCT_EVENTS.AppOpened,
    );

    expect([...declared].sort()).toEqual([...covered].sort());
  });
});
