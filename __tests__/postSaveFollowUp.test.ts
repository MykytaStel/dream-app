import { getDreamCopy } from '../src/constants/copy/dreams';
import { getPostSaveFollowUps } from '../src/features/dreams/model/postSaveFollowUp';

describe('post-save follow-up queue', () => {
  const copy = getDreamCopy('en');

  test('queues transcript work before refine when an audio-only dream was saved', () => {
    const followUps = getPostSaveFollowUps(
      {
        id: 'dream-audio',
        createdAt: Date.now(),
        sleepDate: '2026-03-12',
        audioUri: 'file:///dream.m4a',
        tags: [],
      },
      copy,
    );

    expect(followUps).toHaveLength(2);
    expect(followUps[0]).toMatchObject({
      key: 'transcript',
      focusSection: 'transcript',
      title: copy.postSaveFollowUpTranscriptTitle,
    });
    expect(followUps[1]).toMatchObject({
      key: 'refine',
      focusSection: 'written',
      title: copy.postSaveFollowUpRefineTitle,
    });
  });

  test('keeps refine ahead of reflection when saved text is still sparse', () => {
    const followUps = getPostSaveFollowUps(
      {
        id: 'dream-text',
        createdAt: Date.now(),
        sleepDate: '2026-03-12',
        text: 'blood sun hallway',
        tags: [],
      },
      copy,
    );

    expect(followUps).toHaveLength(2);
    expect(followUps[0].key).toBe('refine');
    expect(followUps[1].key).toBe('reflection');
  });

  test('falls back to reflection when the capture is already substantive', () => {
    const followUps = getPostSaveFollowUps(
      {
        id: 'dream-rich',
        createdAt: Date.now(),
        sleepDate: '2026-03-12',
        text: 'I was walking through a flooded station and kept trying to find my sister before the train doors closed again.',
        tags: [],
      },
      copy,
    );

    expect(followUps).toHaveLength(1);
    expect(followUps[0]).toMatchObject({
      key: 'reflection',
      focusSection: 'reflection',
      title: copy.postSaveFollowUpReflectionTitle,
    });
  });
});
