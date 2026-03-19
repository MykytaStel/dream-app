import { kv } from '../src/services/storage/mmkv';
import {
  getDreamDeletionTombstone,
  listDreamDeletionTombstones,
} from '../src/features/dreams/repository/dreamDeletionTombstonesRepository';
import {
  archiveDream,
  clearDreamTranscript,
  deleteDream,
  getDream,
  listDreams,
  markDreamSynced,
  markDreamSyncError,
  markDreamSyncing,
  saveDreamTranscriptEdit,
  saveDream,
  starDream,
  updateDreamTranscriptState,
  upsertDreamFromSyncBundle,
  unstarDream,
  unarchiveDream,
} from '../src/features/dreams/repository/dreamsRepository';
import {
  getSavedDreamThreads,
  toggleSavedDreamThread,
} from '../src/features/stats/services/dreamThreadShelfService';
import {
  getSavedMonthlyReportMonths,
  toggleSavedMonthlyReportMonth,
} from '../src/features/stats/services/monthlyReportShelfService';

describe('dream repository flows', () => {
  beforeEach(() => {
    kv.clearAll();
  });

  async function flushDeferredPersistence() {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 0));
  }

  test('create and edit use same sanitize/update rules', () => {
    saveDream({
      id: 'dream-1',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      title: '  First title  ',
      text: '  initial text ',
      tags: ['  Blue Sky ', 'blue-sky', 'night walk'],
      mood: 'neutral',
      sleepContext: {
        stressLevel: 1,
        alcoholTaken: false,
        medications: '  Mg ',
      },
    });

    saveDream({
      id: 'dream-1',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      title: '  Updated title ',
      text: ' updated text  ',
      tags: [' lucid  dream ', 'LUCID dream'],
      mood: 'positive',
      sleepContext: {
        stressLevel: 2,
        alcoholTaken: true,
        medications: '  ',
        importantEvents: '  demo day  ',
      },
    });

    const all = listDreams();
    expect(all).toHaveLength(1);
    expect(all[0].title).toBe('Updated title');
    expect(all[0].text).toBe('updated text');
    expect(all[0].tags).toEqual(['lucid-dream']);
    expect(all[0].sleepContext).toEqual({
      stressLevel: 2,
      alcoholTaken: true,
      importantEvents: 'demo day',
    });
  });

  test('archive, filter and delete flow is consistent', () => {
    saveDream({
      id: 'a',
      createdAt: 1710000000000,
      sleepDate: '2026-03-04',
      text: 'A',
      tags: [],
    });
    saveDream({
      id: 'b',
      createdAt: 1710001000000,
      sleepDate: '2026-03-05',
      text: 'B',
      tags: [],
    });

    archiveDream('a');
    let all = listDreams();
    expect(all.filter(dream => !dream.archivedAt)).toHaveLength(1);
    expect(all.filter(dream => Boolean(dream.archivedAt))).toHaveLength(1);
    expect(getDream('a')?.archivedAt).toBeDefined();

    unarchiveDream('a');
    all = listDreams();
    expect(all.filter(dream => !dream.archivedAt)).toHaveLength(2);
    expect(all.filter(dream => Boolean(dream.archivedAt))).toHaveLength(0);

    deleteDream('b');
    all = listDreams();
    expect(all.map(dream => dream.id)).toEqual(['a']);
    expect(getDreamDeletionTombstone('b')).toMatchObject({
      dreamId: 'b',
      syncStatus: 'local',
    });
  });

  test('reconciles saved threads after archive mutations remove the last matching dream', async () => {
    saveDream({
      id: 'bridge-1',
      createdAt: 1710000000000,
      sleepDate: '2026-03-04',
      title: 'Bridge one',
      text: 'I crossed the bridge again.',
      tags: ['bridge'],
    });

    toggleSavedDreamThread('bridge', 'theme');
    expect(getSavedDreamThreads()).toHaveLength(1);

    deleteDream('bridge-1');
    await flushDeferredPersistence();

    expect(getSavedDreamThreads()).toEqual([]);
  });

  test('reconciles saved months after archive mutations remove the last dream from that month', async () => {
    saveDream({
      id: 'march-only',
      createdAt: 1710000000000,
      sleepDate: '2026-03-04',
      text: 'March dream',
      tags: [],
    });

    toggleSavedMonthlyReportMonth('2026-03');
    expect(getSavedMonthlyReportMonths()).toHaveLength(1);

    deleteDream('march-only');
    await flushDeferredPersistence();

    expect(getSavedMonthlyReportMonths()).toEqual([]);
  });

  test('supports starring and unstarring dreams', () => {
    saveDream({
      id: 'fav',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Favorite dream',
      tags: [],
    });

    expect(typeof starDream('fav').starredAt).toBe('number');
    expect(typeof getDream('fav')?.starredAt).toBe('number');

    unstarDream('fav');
    expect(getDream('fav')?.starredAt).toBeUndefined();
  });

  test('keeps stable sort by sleepDate desc then createdAt desc', () => {
    saveDream({
      id: 'x',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'X',
      tags: [],
    });
    saveDream({
      id: 'y',
      createdAt: 1710002000000,
      sleepDate: '2026-03-05',
      text: 'Y',
      tags: [],
    });
    saveDream({
      id: 'z',
      createdAt: 1710001000000,
      sleepDate: '2026-03-06',
      text: 'Z',
      tags: [],
    });

    expect(listDreams().map(dream => dream.id)).toEqual(['z', 'x', 'y']);
  });

  test('preserves sleep context booleans and trims optional text', () => {
    saveDream({
      id: 'ctx',
      createdAt: 1710000000000,
      sleepDate: '2026-03-01',
      text: 'context',
      tags: [],
      sleepContext: {
        stressLevel: 0,
        alcoholTaken: false,
        caffeineLate: false,
        medications: '  melatonin ',
        importantEvents: '   ',
        healthNotes: '  headache ',
      },
    });

    expect(getDream('ctx')?.sleepContext).toEqual({
      stressLevel: 0,
      alcoholTaken: false,
      caffeineLate: false,
      medications: 'melatonin',
      healthNotes: 'headache',
    });
  });

  test('supports edited transcript lifecycle without mixing it into written notes', () => {
    saveDream({
      id: 'voice-edit',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Original authored note',
      audioUri: 'file:///voice-edit.m4a',
      transcript: 'Initial generated transcript',
      transcriptStatus: 'ready',
      transcriptSource: 'generated',
      tags: [],
    });

    saveDreamTranscriptEdit('voice-edit', '  Transcript edited by hand  ');

    expect(getDream('voice-edit')).toMatchObject({
      text: 'Original authored note',
      transcript: 'Transcript edited by hand',
      transcriptStatus: 'ready',
      transcriptSource: 'edited',
      syncStatus: 'local',
    });
  });

  test('preserves previous transcript while replace attempt is processing or fails', () => {
    saveDream({
      id: 'voice-replace',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      audioUri: 'file:///voice-replace.m4a',
      transcript: 'Stable previous transcript',
      transcriptStatus: 'ready',
      transcriptSource: 'generated',
      tags: [],
    });

    updateDreamTranscriptState('voice-replace', {
      transcriptStatus: 'processing',
      transcriptUpdatedAt: Date.now(),
    });
    expect(getDream('voice-replace')).toMatchObject({
      transcript: 'Stable previous transcript',
      transcriptStatus: 'processing',
      transcriptSource: 'generated',
    });

    updateDreamTranscriptState('voice-replace', {
      transcriptStatus: 'error',
      transcriptUpdatedAt: Date.now(),
    });
    expect(getDream('voice-replace')).toMatchObject({
      transcript: 'Stable previous transcript',
      transcriptStatus: 'error',
      transcriptSource: 'generated',
    });
  });

  test('clears transcript and resets state back to audio-ready idle', () => {
    saveDream({
      id: 'voice-clear',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      audioUri: 'file:///voice-clear.m4a',
      transcript: 'Transcript to clear',
      transcriptStatus: 'ready',
      transcriptSource: 'edited',
      tags: [],
    });

    clearDreamTranscript('voice-clear');

    expect(getDream('voice-clear')).toMatchObject({
      audioUri: 'file:///voice-clear.m4a',
      transcript: undefined,
      transcriptStatus: 'idle',
      transcriptSource: undefined,
      transcriptUpdatedAt: undefined,
    });
  });

  test('tracks sync lifecycle metadata without losing remote bookkeeping', () => {
    saveDream({
      id: 'sync-dream',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Sync me',
      tags: [],
    });

    expect(getDream('sync-dream')).toMatchObject({
      updatedAt: 1710000000000,
      syncStatus: 'local',
    });

    markDreamSyncing('sync-dream');
    expect(getDream('sync-dream')?.syncStatus).toBe('syncing');

    markDreamSynced('sync-dream', {
      audioRemotePath: 'user-1/sync-dream/audio.m4a',
      syncedAt: 1710000005000,
    });
    expect(getDream('sync-dream')).toMatchObject({
      syncStatus: 'synced',
      audioRemotePath: 'user-1/sync-dream/audio.m4a',
      lastSyncedAt: 1710000005000,
    });

    saveDream({
      id: 'sync-dream',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Sync me again',
      tags: [],
    });
    expect(getDream('sync-dream')).toMatchObject({
      text: 'Sync me again',
      syncStatus: 'local',
      audioRemotePath: 'user-1/sync-dream/audio.m4a',
      lastSyncedAt: 1710000005000,
    });

    markDreamSyncError('sync-dream', 'upload failed');
    expect(getDream('sync-dream')).toMatchObject({
      syncStatus: 'error',
      syncError: 'upload failed',
    });
  });

  test('can hydrate repository state from a remote sync bundle', () => {
    const result = upsertDreamFromSyncBundle({
      dream: {
        id: 'remote-1',
        user_id: 'user-1',
        created_at: '2026-03-06T08:00:00.000Z',
        updated_at: '2026-03-06T09:30:00.000Z',
        sleep_date: '2026-03-06',
        title: 'Remote dream',
        raw_text: 'Cloud copy',
        audio_storage_path: 'user-1/remote-1/audio.m4a',
        transcript: null,
        transcript_status: null,
        transcript_source: null,
        transcript_updated_at: null,
        mood: 'positive',
        lucidity: 2,
        archived_at: null,
        starred_at: null,
        analysis_provider: null,
        analysis_status: null,
        analysis_summary: null,
        analysis_themes: [],
        analysis_generated_at: null,
        analysis_error_message: null,
      },
      tags: [{ dream_id: 'remote-1', tag: 'ocean', position: 0 }],
      wakeEmotions: [{ dream_id: 'remote-1', emotion: 'curious', position: 0 }],
      preSleepEmotions: [
        { dream_id: 'remote-1', emotion: 'hopeful', position: 0 },
      ],
      sleepContext: {
        dream_id: 'remote-1',
        stress_level: 1,
        alcohol_taken: false,
        caffeine_late: true,
        medications: null,
        important_events: 'Late planning',
        health_notes: null,
      },
    });

    expect(result).toMatchObject({
      id: 'remote-1',
      lucidity: 2,
      syncStatus: 'synced',
      audioRemotePath: 'user-1/remote-1/audio.m4a',
      wakeEmotions: ['curious'],
      sleepContext: {
        preSleepEmotions: ['hopeful'],
        importantEvents: 'Late planning',
      },
    });
    expect(getDreamDeletionTombstone('remote-1')).toBeUndefined();
  });

  test('saving a dream with the same id clears a pending deletion tombstone', () => {
    saveDream({
      id: 'restore-me',
      createdAt: 1710000000000,
      sleepDate: '2026-03-06',
      text: 'Before delete',
      tags: [],
    });

    deleteDream('restore-me');
    expect(listDreamDeletionTombstones()).toHaveLength(1);

    saveDream({
      id: 'restore-me',
      createdAt: 1710000000000,
      updatedAt: 1710001000000,
      sleepDate: '2026-03-06',
      text: 'Restored with same id',
      tags: [],
    });

    expect(getDreamDeletionTombstone('restore-me')).toBeUndefined();
    expect(getDream('restore-me')?.text).toBe('Restored with same id');
  });

  test('rejects invalid captures before writing to storage', () => {
    expect(() =>
      saveDream({
        id: 'invalid-title-only',
        createdAt: 1710000000000,
        sleepDate: '2026-03-06',
        title: 'Only title',
        tags: [],
      }),
    ).toThrow('missing-content');

    expect(() =>
      saveDream({
        id: 'invalid-date',
        createdAt: 1710000000000,
        sleepDate: '2026-02-30',
        text: 'body',
        tags: [],
      }),
    ).toThrow('invalid-sleep-date');

    expect(listDreams()).toEqual([]);
  });
});
