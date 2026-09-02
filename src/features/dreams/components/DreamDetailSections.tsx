import React from 'react';
import { View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { DreamAnalysisSection } from './detail/DreamAnalysisSection';
import { DreamCaptureSection } from './detail/DreamCaptureSection';
import { DreamLucidSection } from './detail/DreamLucidSection';
import { DreamNightmareSection } from './detail/DreamNightmareSection';
import {
  DreamReflectionSection,
  hasReflectionPrompt,
} from './detail/DreamReflectionSection';
import { DreamRelatedSection } from './detail/DreamRelatedSection';
import { DreamStateSection } from './detail/DreamStateSection';
import { Card } from '../../../components/ui/Card';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import type { Dream } from '../model/dream';
import type { RelatedDream } from '../model/relatedDreams';
import type {
  DreamDetailCopy,
  DreamDetailSectionsState,
  DreamDetailViewModel,
} from '../model/dreamDetailPresentation';
import type { DreamTranscriptionProgress } from '../services/dreamTranscriptionService';
import type { DreamDetailScreenStyles } from '../screens/DreamDetailScreen.styles';

const detailLayoutTransition = LinearTransition.duration(160);

type DreamDetailSectionsProps = {
  dream: Dream;
  copy: DreamDetailCopy;
  styles: DreamDetailScreenStyles;
  viewModel: DreamDetailViewModel;
  relatedDreams: RelatedDream[];
  sections: DreamDetailSectionsState;
  isTranscribingAudio: boolean;
  isEditingTranscript: boolean;
  transcriptDraft: string;
  transcriptionProgress: DreamTranscriptionProgress | null;
  analysisSettings: DreamAnalysisSettings;
  isGeneratingAnalysis: boolean;
  stressLabels: Record<number, string>;
  wakeEmotionLabels: Record<string, string>;
  preSleepEmotionLabels: Record<string, string>;
  practiceCopy: {
    openLucid: string;
    openNightmares: string;
    quickNightmareRewrite: string;
    nightmareRewritePrompt: string;
    nightmareGroundingTitle: string;
    nightmareGroundingBody: string;
    lucidDreamSignsLabel: string;
    lucidTriggerLabel: string;
    lucidRecallLabel: string;
    lucidStabilizationLabel: string;
    nightmareWokeLabel: string;
    nightmareAftereffectsLabel: string;
    nightmareRewriteStatusLabel: string;
  };
  lucidTechniqueLabels: Record<string, string>;
  lucidControlLabels: Record<string, string>;
  lucidStabilizationLabels: Record<string, string>;
  nightmareAftereffectLabels: Record<string, string>;
  nightmareGroundingLabels: Record<string, string>;
  nightmareRescriptLabels: Record<string, string>;
  setTranscriptDraft: (value: string) => void;
  onToggleSection: (section: keyof DreamDetailSectionsState) => void;
  onToggleStateSections: () => void;
  onStartTranscriptEdit: () => void;
  onCancelTranscriptEdit: () => void;
  onSaveTranscriptEdit: () => void;
  onClearTranscript: () => void;
  onTranscribeAudio: () => void;
  onGenerateAnalysis: () => void;
  onClearAnalysis: () => void;
  isDownloadingAudio: boolean;
  onDownloadAudio: () => void;
  onEditDream: () => void;
  onOpenRelatedDream: (dreamId: string) => void;
  onOpenSettingsForAnalysis: () => void;
  onOpenDreamPractice: (focus: 'lucid' | 'nightmares') => void;
};

export function DreamDetailSections({
  dream,
  copy,
  styles,
  viewModel,
  relatedDreams,
  sections: _sections,
  isTranscribingAudio,
  isEditingTranscript,
  transcriptDraft,
  transcriptionProgress,
  analysisSettings,
  isGeneratingAnalysis,
  stressLabels,
  wakeEmotionLabels,
  preSleepEmotionLabels,
  practiceCopy,
  lucidTechniqueLabels,
  lucidControlLabels,
  lucidStabilizationLabels,
  nightmareAftereffectLabels,
  nightmareGroundingLabels,
  nightmareRescriptLabels,
  setTranscriptDraft,
  onToggleSection: _onToggleSection,
  onToggleStateSections: _onToggleStateSections,
  onStartTranscriptEdit,
  onCancelTranscriptEdit,
  onSaveTranscriptEdit,
  onClearTranscript,
  onTranscribeAudio,
  onGenerateAnalysis,
  onClearAnalysis,
  isDownloadingAudio,
  onDownloadAudio,
  onEditDream,
  onOpenRelatedDream,
  onOpenSettingsForAnalysis,
  onOpenDreamPractice,
}: DreamDetailSectionsProps) {
  // A raw capture used to show every section, most of them holding only "nothing
  // saved" text — including nightmare grounding on a dream that was never a
  // nightmare. Sections with no content and no reason to be looked for are
  // hidden; the ones that stay are the content, its prompt, and real CTAs.
  const showRelated = relatedDreams.length > 0;
  const showLucid = Boolean(dream.lucidPractice || viewModel.lucidityLabel);
  const showNightmare = Boolean(
    dream.nightmare || dream.tags.includes('nightmare'),
  );
  const showState =
    viewModel.hasContext || viewModel.hasEmotions || viewModel.hasLucidity;

  return (
    <Animated.View layout={detailLayoutTransition}>
      <Card style={styles.detailSheet}>
        <DreamCaptureSection
          dream={dream}
          copy={copy}
          styles={styles}
          viewModel={viewModel}
          isTranscribingAudio={isTranscribingAudio}
          isEditingTranscript={isEditingTranscript}
          transcriptDraft={transcriptDraft}
          transcriptionProgress={transcriptionProgress}
          isDownloadingAudio={isDownloadingAudio}
          setTranscriptDraft={setTranscriptDraft}
          onStartTranscriptEdit={onStartTranscriptEdit}
          onCancelTranscriptEdit={onCancelTranscriptEdit}
          onSaveTranscriptEdit={onSaveTranscriptEdit}
          onClearTranscript={onClearTranscript}
          onTranscribeAudio={onTranscribeAudio}
          onDownloadAudio={onDownloadAudio}
        />

        {hasReflectionPrompt(viewModel) ? (
          <View style={styles.sheetDivider} />
        ) : null}
        <DreamReflectionSection
          dream={dream}
          copy={copy}
          styles={styles}
          viewModel={viewModel}
          relatedDreams={relatedDreams}
          onEditDream={onEditDream}
          onOpenRelatedDream={onOpenRelatedDream}
          onTranscribeAudio={onTranscribeAudio}
          onStartTranscriptEdit={onStartTranscriptEdit}
        />

        {showRelated ? (
          <>
            <View style={styles.sheetDivider} />
            <DreamRelatedSection
              dream={dream}
              copy={copy}
              styles={styles}
              relatedDreams={relatedDreams}
              onOpenRelatedDream={onOpenRelatedDream}
            />
          </>
        ) : null}

        <View style={styles.sheetDivider} />
        <DreamAnalysisSection
          dream={dream}
          copy={copy}
          styles={styles}
          viewModel={viewModel}
          analysisSettings={analysisSettings}
          isGeneratingAnalysis={isGeneratingAnalysis}
          onGenerateAnalysis={onGenerateAnalysis}
          onClearAnalysis={onClearAnalysis}
          onOpenSettingsForAnalysis={onOpenSettingsForAnalysis}
        />

        {showLucid ? (
          <>
            <View style={styles.sheetDivider} />
            <DreamLucidSection
              dream={dream}
              viewModel={viewModel}
              copy={copy}
              styles={styles}
              practiceCopy={practiceCopy}
              lucidTechniqueLabels={lucidTechniqueLabels}
              lucidControlLabels={lucidControlLabels}
              lucidStabilizationLabels={lucidStabilizationLabels}
              onOpenDreamPractice={onOpenDreamPractice}
            />
          </>
        ) : null}

        {showNightmare ? (
          <>
            <View style={styles.sheetDivider} />
            <DreamNightmareSection
              dream={dream}
              copy={copy}
              styles={styles}
              practiceCopy={practiceCopy}
              nightmareAftereffectLabels={nightmareAftereffectLabels}
              nightmareGroundingLabels={nightmareGroundingLabels}
              nightmareRescriptLabels={nightmareRescriptLabels}
              onOpenDreamPractice={onOpenDreamPractice}
              onEditDream={onEditDream}
            />
          </>
        ) : null}

        {showState ? (
          <>
            <View style={styles.sheetDivider} />
            <DreamStateSection
              dream={dream}
              copy={copy}
              styles={styles}
              viewModel={viewModel}
              stressLabels={stressLabels}
              wakeEmotionLabels={wakeEmotionLabels}
              preSleepEmotionLabels={preSleepEmotionLabels}
            />
          </>
        ) : null}
      </Card>
    </Animated.View>
  );
}
