import React from 'react';
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '@shopify/restyle';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DreamDetailSections } from '../src/features/dreams/components/DreamDetailSections';
import { createDreamDetailScreenStyles } from '../src/features/dreams/screens/DreamDetailScreen.styles';
import { getDreamDetailViewModel } from '../src/features/dreams/model/dreamDetailPresentation';
import { getDreamCopy, getDreamMoodLabels } from '../src/constants/copy/dreams';
import { getPracticeCopy } from '../src/constants/copy/practice';
import { themes } from '../src/theme/theme';
import type { Dream } from '../src/features/dreams/model/dream';

/**
 * What the dream detail screen puts on the page, pinned before it is split up.
 *
 * One component, a thousand lines, fifty props and no tests at all. Inside it
 * are seven self-contained sections — capture, reflection, related, analysis,
 * lucid practice, nightmare, state — each with its own heading, and each
 * reachable only by rendering the whole thing.
 *
 * This is the net for splitting them out. It asserts on what a reader sees
 * rather than on how the JSX is arranged, so a section that moves into its own
 * file has to keep showing the same things or this fails.
 *
 * The dream below deliberately fills every section. A fixture that leaves
 * lucidity or nightmare empty would let those sections be dropped entirely
 * without a single test noticing.
 */

// The audio player stops playback when the screen loses focus. Only that hook
// is needed here, and the real navigation package ships ESM this jest config
// does not transform.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (effect: () => (() => void) | void) => {
    // Required inside the factory: jest forbids a mock from closing over an
    // import, and React is one.
    require('react').useEffect(effect, [effect]);
  },
}));

jest.mock('../src/features/dreams/services/audioService', () => ({
  getDuration: jest.fn().mockResolvedValue(0),
  play: jest.fn(),
  stop: jest.fn().mockResolvedValue(undefined),
}));

const copy = getDreamCopy('en');
const practiceCopy = getPracticeCopy('en');
const moodLabels = getDreamMoodLabels('en');
const styles = createDreamDetailScreenStyles(themes.kaleidoscope);

const SAFE_AREA_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

const analysisSettings = {
  enabled: true,
  provider: 'manual' as const,
  allowNetwork: false,
};

const dream: Dream = {
  id: 'dream-1',
  createdAt: Date.UTC(2026, 6, 20, 7, 30),
  sleepDate: '2026-07-20',
  title: 'Glass hallway',
  text: 'I walked a hallway made of glass and the floor kept shifting.',
  transcript: 'A spoken version of the same hallway.',
  transcriptSource: 'generated',
  audioUri: 'file:///audio/dream-1.m4a',
  tags: ['glass', 'hallway'],
  mood: 'mysterious',
  wakeEmotions: ['curious'],
  lucidity: 2,
  lucidPractice: {
    technique: 'wbtb',
    dreamSigns: ['mirror'],
    trigger: 'a door that was not there',
    controlAreas: ['scene'],
    stabilizationActions: ['hands'],
    recallScore: 4,
  },
  nightmare: {
    explicit: true,
    distress: 3,
    recurring: true,
    recurringKey: 'the corridor',
    wokeFromDream: true,
    aftereffects: ['panic'],
    groundingUsed: ['light'],
    rewrittenEnding: 'The corridor opened onto a garden.',
    rescriptStatus: 'rehearsed',
  },
  sleepContext: {
    stressLevel: 2,
    preSleepEmotions: ['restless'],
    caffeineLate: true,
    importantEvents: 'A long evening walk.',
  },
  analysis: {
    provider: 'manual',
    status: 'ready',
    generatedAt: Date.UTC(2026, 6, 20, 8),
    summary: 'The dream circles around transition and distance.',
    themes: ['transition'],
  },
};

const relatedDreams = [
  {
    dream: { ...dream, id: 'dream-2', title: 'Mirror apartment' },
    sharedSignals: ['glass'],
    score: 2,
  },
];

const viewModel = getDreamDetailViewModel({
  dream,
  copy,
  moodLabels,
  analysisSettings,
  relatedDreams,
  isTranscribingAudio: false,
  now: Date.UTC(2026, 6, 21, 9),
});

const sections = {
  reflection: true,
  written: true,
  emotions: true,
  transcript: true,
  tags: true,
  related: true,
  analysis: true,
  context: true,
  audio: true,
};

const labels = { curious: 'Curious', restless: 'Restless' };

function renderSections() {
  return render(
    <SafeAreaProvider initialMetrics={SAFE_AREA_METRICS}>
      <ThemeProvider theme={themes.kaleidoscope}>
        <DreamDetailSections
          dream={dream}
          copy={copy}
          styles={styles}
          viewModel={viewModel}
          relatedDreams={relatedDreams}
          sections={sections}
          isTranscribingAudio={false}
          isEditingTranscript={false}
          transcriptDraft=""
          transcriptionProgress={null}
          analysisSettings={analysisSettings}
          isGeneratingAnalysis={false}
          stressLabels={{ 0: 'None', 1: 'Low', 2: 'Some', 3: 'High' }}
          wakeEmotionLabels={labels}
          preSleepEmotionLabels={labels}
          practiceCopy={practiceCopy}
          lucidTechniqueLabels={{ wbtb: 'Wake back to bed' }}
          lucidControlLabels={{ scene: 'Scene' }}
          lucidStabilizationLabels={{ hands: 'Hands' }}
          nightmareAftereffectLabels={{ panic: 'Panic' }}
          nightmareGroundingLabels={{ light: 'Turned on a light' }}
          nightmareRescriptLabels={{ rehearsed: 'Rehearsed' }}
          setTranscriptDraft={jest.fn()}
          onToggleSection={jest.fn()}
          onToggleStateSections={jest.fn()}
          onStartTranscriptEdit={jest.fn()}
          onCancelTranscriptEdit={jest.fn()}
          onSaveTranscriptEdit={jest.fn()}
          onClearTranscript={jest.fn()}
          onTranscribeAudio={jest.fn()}
          onGenerateAnalysis={jest.fn()}
          onClearAnalysis={jest.fn()}
          isDownloadingAudio={false}
          onDownloadAudio={jest.fn()}
          onEditDream={jest.fn()}
          onOpenRelatedDream={jest.fn()}
          onOpenSettingsForAnalysis={jest.fn()}
          onOpenDreamPractice={jest.fn()}
        />
      </ThemeProvider>
    </SafeAreaProvider>,
  );
}

describe('dream detail sections', () => {
  test('every section is on the page', async () => {
    // Seven headings, one per section. This is the list that a split has to
    // keep intact — losing one would otherwise be invisible.
    const { getAllByText } = await renderSections();

    for (const heading of [
      copy.detailCaptureTitle,
      copy.detailReflectionTitle,
      copy.detailRelatedTitle,
      copy.detailAnalysisTitle,
      practiceCopy.openLucid,
      practiceCopy.openNightmares,
      copy.detailStateTitle,
    ]) {
      // `getAllByText`, because some of these headings are also the label on
      // the button that opens the matching practice screen.
      expect([heading, getAllByText(heading).length > 0]).toEqual([
        heading,
        true,
      ]);
    }
  });

  test('written text wins the capture panel, and the transcript is not shown at all', async () => {
    // Found by writing this test. The panel shows one or the other and text
    // wins, which is reasonable. What is not obvious is that the transcript
    // block below it shows only where the transcript came from — its body is
    // rendered nowhere unless the transcript editor is open.
    //
    // So a dream with both a written note and a voice transcript offers no way
    // to read the transcript without pressing edit. Recorded rather than
    // changed: what that screen should show is a product decision, and this
    // test exists to make the split below safe, not to alter the screen.
    const { getAllByText, getByText, queryByText } = await renderSections();

    expect(getByText(dream.text!)).toBeTruthy();
    expect(queryByText(dream.transcript!)).toBeNull();
    expect(
      getAllByText(viewModel.transcriptSourceLabel!).length,
    ).toBeGreaterThan(0);
  });

  test('the lucid section shows the practice that was recorded', async () => {
    const { getByText } = await renderSections();

    expect(getByText('Wake back to bed')).toBeTruthy();
    expect(getByText('mirror')).toBeTruthy();
    expect(getByText('a door that was not there')).toBeTruthy();
  });

  test('the nightmare section shows the rewrite and the grounding', async () => {
    const { getByText } = await renderSections();

    expect(getByText('The corridor opened onto a garden.')).toBeTruthy();
    expect(getByText('Turned on a light')).toBeTruthy();
    expect(getByText('Rehearsed')).toBeTruthy();
  });

  test('the analysis section shows the summary that was generated', async () => {
    const { getByText } = await renderSections();

    expect(
      getByText('The dream circles around transition and distance.'),
    ).toBeTruthy();
  });

  test('the related section names the dream it points at', async () => {
    const { getByText } = await renderSections();

    expect(getByText('Mirror apartment')).toBeTruthy();
  });
});
