import {
  createDreamAudioStoragePath,
  createDreamEntryRow,
  createDreamSyncBundle,
  hydrateDreamFromSyncBundle,
} from '../src/services/api/contracts/dreamSync';

describe('dream sync contract', () => {
  test('creates stable storage paths for uploaded audio', () => {
    expect(
      createDreamAudioStoragePath({
        userId: 'user-1',
        dreamId: 'dream-1',
        filename: 'voice note (final).m4a',
      }),
    ).toBe('user-1/dream-1/voice-note--final-.m4a');
  });

  test('maps a local dream into sync rows and back', () => {
    const bundle = createDreamSyncBundle(
      {
        id: 'dream-1',
        createdAt: 1710000000000,
        updatedAt: 1710001000000,
        sleepDate: '2026-03-06',
        title: 'Blue room',
        text: 'Local body',
        audioRemotePath: 'user-1/dream-1/audio.m4a',
        syncStatus: 'local',
        tags: ['ocean', 'door'],
        mood: 'positive',
        wakeEmotions: ['calm', 'curious'],
        sleepContext: {
          stressLevel: 1,
          preSleepEmotions: ['hopeful'],
          importantEvents: 'Release prep',
        },
      },
      'user-1',
    );

    expect(createDreamEntryRow(hydrateDreamFromSyncBundle(bundle), 'user-1')).toMatchObject({
      id: 'dream-1',
      user_id: 'user-1',
      raw_text: 'Local body',
      audio_storage_path: 'user-1/dream-1/audio.m4a',
      analysis_themes: [],
    });

    expect(hydrateDreamFromSyncBundle(bundle)).toMatchObject({
      id: 'dream-1',
      updatedAt: 1710001000000,
      audioRemotePath: 'user-1/dream-1/audio.m4a',
      syncStatus: 'synced',
      tags: ['ocean', 'door'],
      wakeEmotions: ['calm', 'curious'],
      sleepContext: {
        stressLevel: 1,
        preSleepEmotions: ['hopeful'],
        importantEvents: 'Release prep',
      },
    });
  });
});
