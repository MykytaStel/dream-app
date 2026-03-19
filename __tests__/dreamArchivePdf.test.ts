import { DREAM_EXPORT_VERSION, type DreamExportV1 } from '../src/features/settings/services/dataExportService';
import { buildDreamArchivePdfHtml } from '../src/features/settings/services/dreamArchivePdf';

function createPayload(overrides?: Partial<DreamExportV1>): DreamExportV1 {
  return {
    version: DREAM_EXPORT_VERSION,
    exportedAt: '2026-03-19T10:30:00.000Z',
    appVersion: 'v0.6.0',
    platform: 'ios',
    locale: 'en',
    storageSchemaVersion: 12,
    summary: {
      dreamCount: 2,
      archivedDreamCount: 1,
      audioDreamCount: 1,
      transcribedDreamCount: 1,
      editedTranscriptCount: 0,
      analyzedDreamCount: 1,
      starredDreamCount: 1,
      draftIncluded: false,
    },
    dreams: [
      {
        id: 'older-dream',
        createdAt: 10,
        title: 'Older dream',
        text: 'Older text',
        tags: ['stairs'],
      },
      {
        id: 'newer-dream',
        createdAt: 20,
        updatedAt: 25,
        starredAt: 22,
        archivedAt: 23,
        sleepDate: '2026-03-18',
        title: 'Newer dream',
        text: 'Newer text',
        transcript: 'Transcript body',
        analysis: {
          provider: 'manual',
          status: 'ready',
          summary: 'Recurring station imagery',
          themes: ['station'],
          generatedAt: 24,
        },
        audioUri: 'file:///dream.m4a',
        tags: ['station'],
        wakeEmotions: ['curious'],
        sleepContext: {
          preSleepEmotions: ['hopeful'],
        },
      },
    ],
    draft: null,
    reminderSettings: {
      enabled: false,
      hour: 8,
      minute: 0,
      style: 'balanced',
    },
    practiceReminderSettings: {
      morning_capture: {
        enabled: false,
        hour: 8,
        minute: 30,
      },
      reality_checks: {
        enabled: false,
        startHour: 10,
        endHour: 20,
        intervalHours: 3,
      },
      evening_intention: {
        enabled: false,
        hour: 21,
        minute: 30,
      },
      wbtb: {
        enabled: false,
        hour: 4,
        minute: 30,
      },
    },
    analysisSettings: {
      enabled: true,
      provider: 'manual',
      allowNetwork: false,
    },
    reviewState: {
      updatedAt: 0,
      savedMonths: [],
      savedThreads: [],
    },
    ...overrides,
  };
}

describe('dream archive pdf html', () => {
  test('renders print-focused front matter and sorts entries newest first', () => {
    const html = buildDreamArchivePdfHtml(createPayload());

    expect(html).toContain('class="front-matter"');
    expect(html).toContain('page-break-after: always');
    expect(html).toContain('Order');
    expect(html).toContain('Newest first');
    expect(html).toContain('Entry 01 / 2');
    expect(html).toContain('Starred');
    expect(html.indexOf('Newer dream')).toBeLessThan(html.indexOf('Older dream'));
  });

  test('renders paragraph-friendly long-form text and clips oversized sections', () => {
    const html = buildDreamArchivePdfHtml(
      createPayload({
        summary: {
          dreamCount: 1,
          archivedDreamCount: 0,
          audioDreamCount: 0,
          transcribedDreamCount: 1,
          editedTranscriptCount: 0,
          analyzedDreamCount: 0,
          starredDreamCount: 0,
          draftIncluded: false,
        },
        dreams: [
          {
            id: 'long-dream',
            createdAt: 30,
            title: 'Long dream',
            text: 'First line\nSecond line\n\nThird paragraph',
            transcript: `${'x'.repeat(6001)} tail`,
            tags: [],
          },
        ],
      }),
    );

    expect(html).toContain('<p>First line<br />Second line</p>');
    expect(html).toContain('<p>Third paragraph</p>');
    expect(html).toContain('clipped for the PDF snapshot');
  });
});
