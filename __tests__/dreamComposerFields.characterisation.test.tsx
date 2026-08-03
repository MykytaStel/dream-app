import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { useDreamComposerForm } from '../src/features/dreams/components/useDreamComposerForm';
import { saveDream } from '../src/features/dreams/repository/dreamsRepository';
import type { Dream } from '../src/features/dreams/model/dream';

/**
 * What the composer saves, pinned before the state behind it moves.
 *
 * `useDreamComposerForm` holds forty-three `useState` calls and returns a
 * hundred and ten fields. Twenty-two of those states are three domain objects
 * that already exist as types — `SleepContext`, `LucidPractice` and
 * `NightmareSupport` — flattened into individual pieces on the way in and
 * reassembled by hand on the way out.
 *
 * This is a characterisation test: it describes the behaviour as it is today,
 * so that moving the state into cohesive hooks can be shown to change nothing.
 * It is written against the saved `Dream`, not against the hook's internals,
 * which is the only level that survives the move.
 *
 * The guards are the interesting part and the easiest thing to break. Each of
 * the three objects is omitted entirely when nothing in it was filled in, so a
 * dream captured in ten seconds does not carry three empty records for the rest
 * of its life.
 */

jest.mock('../src/features/dreams/repository/dreamsRepository', () => ({
  saveDream: jest.fn(),
}));

jest.mock('../src/features/dreams/services/audioService', () => ({
  cleanupOrphanedAudioFiles: jest.fn().mockResolvedValue(0),
  startRecording: jest.fn(),
  stopRecording: jest.fn(),
}));

jest.mock('../src/features/dreams/services/dreamDraftService', () => ({
  clearDreamDraft: jest.fn(),
  clearDreamEditDraft: jest.fn(),
  getDreamDraft: jest.fn(() => null),
  // No stored edit, so these cases keep reading the dream itself — which is
  // exactly what they characterise.
  getDreamEditDraft: jest.fn(() => null),
  saveDreamDraft: jest.fn(),
  saveDreamEditDraft: jest.fn(),
}));

jest.mock('../src/services/observability/events', () => ({
  trackDreamSaved: jest.fn(),
}));

const copy = {
  saveErrorDescription: 'Missing content',
  saveErrorTitle: 'Could not save',
  sleepDateInvalidDescription: 'Invalid date',
  sleepDateInvalidTitle: 'Invalid date',
  updateSuccessTitle: 'Updated',
  updateSuccessDescription: 'Updated',
  saveSuccessTitle: 'Saved',
  saveSuccessDescription: 'Saved',
  recordErrorTitle: 'Error',
  audioPermissionDenied: 'Denied',
  audioPermissionUnavailable: 'Unavailable',
  audioSimulatorHint: 'Simulator hint',
  audioErrorTitle: 'Audio error',
} as never;

type Form = ReturnType<typeof useDreamComposerForm>;

let latestForm: Form | null = null;
let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

function mount(initialDream?: Dream) {
  function Harness() {
    latestForm = useDreamComposerForm({
      mode: initialDream ? 'edit' : 'create',
      entryMode: 'default',
      onSaved: jest.fn(),
      copy,
      initialDream,
    } as never);

    return null;
  }

  ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(<Harness />);
  });
}

/**
 * The form as of the latest render, never the one captured at mount.
 *
 * `onSave` is a `useCallback` closing over the state it saw when it was
 * created, so holding on to the object returned by the first render and calling
 * its `onSave` later saves the empty form — which is exactly what the first
 * draft of this test did, and it read as the hook being broken.
 */
function form(): Form {
  return latestForm!;
}

/** The single argument `saveDream` was called with. */
function savedDream(): Dream {
  expect(saveDream).toHaveBeenCalledTimes(1);
  return (saveDream as jest.Mock).mock.calls[0][0] as Dream;
}

function act(run: () => void) {
  ReactTestRenderer.act(run);
}

beforeEach(() => {
  latestForm = null;
  renderer = null;
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
  if (renderer) {
    act(() => renderer?.unmount());
  }
  renderer = null;
});

describe('composer field groups', () => {
  test('a bare capture carries none of the three records', () => {
    mount();

    act(() => form().setText('A staircase that kept going.'));
    act(() => form().onSave());

    const dream = savedDream();
    expect(dream.sleepContext).toBeUndefined();
    expect(dream.lucidPractice).toBeUndefined();
    expect(dream.nightmare).toBeUndefined();
  });

  test('sleep context is assembled from its own fields', () => {
    mount();

    act(() => {
      form().setText('Something.');
      form().setStressLevel(2);
      form().setPreSleepEmotions(['restless']);
      form().setCaffeineLate(true);
      form().setMedications('  melatonin  ');
      form().setHealthNotes('   ');
    });
    act(() => form().onSave());

    expect(savedDream().sleepContext).toEqual({
      stressLevel: 2,
      preSleepEmotions: ['restless'],
      alcoholTaken: undefined,
      caffeineLate: true,
      // Trimmed, and an entry that was only whitespace is dropped rather than
      // stored as an empty string.
      medications: 'melatonin',
      importantEvents: undefined,
      healthNotes: undefined,
    });
  });

  test('lucid practice is assembled from its own fields', () => {
    mount();

    act(() => {
      form().setText('Something.');
      form().setLucidTechnique('wbtb');
      form().setControlAreas(['scene']);
      form().setRecallScore(4);
      form().setLucidTrigger('  a door  ');
    });
    act(() => form().onSave());

    expect(savedDream().lucidPractice).toEqual({
      technique: 'wbtb',
      dreamSigns: undefined,
      trigger: 'a door',
      controlAreas: ['scene'],
      stabilizationActions: undefined,
      recallScore: 4,
    });
  });

  test('nightmare support is assembled from its own fields', () => {
    mount();

    act(() => {
      form().setText('Something.');
      form().setNightmareExplicit(true);
      form().setNightmareDistress(3);
      form().setNightmareAftereffects(['panic']);
      form().setNightmareRecurringKey('  the corridor  ');
      form().setNightmareRescriptStatus('drafted');
    });
    act(() => form().onSave());

    expect(savedDream().nightmare).toEqual({
      explicit: true,
      distress: 3,
      recurring: undefined,
      recurringKey: 'the corridor',
      wokeFromDream: undefined,
      aftereffects: ['panic'],
      groundingUsed: undefined,
      rewrittenEnding: undefined,
      rescriptStatus: 'drafted',
    });
  });

  test('editing seeds every group from the dream being edited', () => {
    const existing: Dream = {
      id: 'dream-1',
      createdAt: Date.UTC(2026, 6, 1, 8),
      tags: ['stairs'],
      text: 'The original text.',
      sleepContext: { stressLevel: 3, caffeineLate: true },
      lucidPractice: { technique: 'mild', recallScore: 2 },
      nightmare: { explicit: true, distress: 5 },
    };

    mount(existing);

    expect(form().stressLevel).toBe(3);
    expect(form().caffeineLate).toBe(true);
    expect(form().lucidTechnique).toBe('mild');
    expect(form().recallScore).toBe(2);
    expect(form().nightmareExplicit).toBe(true);
    expect(form().nightmareDistress).toBe(5);
  });

  test('each section has its own rule for opening, and they differ', () => {
    // Six booleans that look interchangeable and are not. In a plain capture
    // every optional section starts closed except the meta one, which opens
    // because this is not the compressed wake flow. Collapsing them into one
    // generic record would quietly lose that.
    mount();

    expect(form().showMoodSection).toBe(false);
    expect(form().showContextSection).toBe(false);
    expect(form().showTagsSection).toBe(false);
    expect(form().showLucidPracticeSection).toBe(false);
    expect(form().showNightmareSection).toBe(false);
    expect(form().showMetaSection).toBe(true);
  });

  test('editing opens every section, because the answers already exist', () => {
    mount({
      id: 'dream-1',
      createdAt: Date.UTC(2026, 6, 1, 8),
      tags: [],
      text: 'Written before.',
    });

    expect(form().showMoodSection).toBe(true);
    expect(form().showContextSection).toBe(true);
    expect(form().showTagsSection).toBe(true);
    expect(form().showLucidPracticeSection).toBe(true);
    expect(form().showNightmareSection).toBe(true);
    expect(form().showMetaSection).toBe(true);
  });

  test('opening one section leaves the others alone', () => {
    mount();

    act(() => form().setShowNightmareSection(true));

    expect(form().showNightmareSection).toBe(true);
    expect(form().showMoodSection).toBe(false);
    expect(form().showContextSection).toBe(false);
  });
});
