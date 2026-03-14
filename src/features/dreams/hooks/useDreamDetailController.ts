import React from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getDreamAnalysisSettings } from '../../analysis/services/dreamAnalysisSettingsService';
import { generateDreamAnalysis } from '../../analysis/services/dreamAnalysisService';
import type { DreamAnalysisSettings } from '../../analysis/model/dreamAnalysis';
import { logActionError } from '../../../app/errorReporting';
import {
  clearLastViewedDream,
  saveLastViewedDream,
} from '../services/lastViewedDreamService';
import { stop } from '../services/audioService';
import { downloadDreamAudio } from '../../../services/cloud/audioDownload';
import {
  type DreamTranscriptionProgress,
  transcribeDreamAudio,
} from '../services/dreamTranscriptionService';
import { getRelatedDreams, type RelatedDream } from '../model/relatedDreams';
import {
  createDefaultExpandedSections,
  createEmptyDetailSectionsState,
  type DreamDetailCopy,
  type DreamDetailSectionsState,
} from '../model/dreamDetailPresentation';
import { type DreamDetailFocusSection } from '../../../app/navigation/routes';
import {
  archiveDream,
  clearDreamAnalysis,
  clearDreamTranscript,
  deleteDream,
  getDream,
  listDreams,
  saveDreamTranscriptEdit,
  setDreamAudioUri,
  starDream,
  unarchiveDream,
  unstarDream,
} from '../repository/dreamsRepository';

type UseDreamDetailControllerArgs = {
  dreamId: string;
  justSaved: boolean;
  focusSection?: DreamDetailFocusSection;
  copy: DreamDetailCopy;
  onAcknowledgeSaved: () => void;
  onDeleteComplete: () => void;
};

type IdleCallbackHandle = number;
type IdleSchedulerShape = {
  requestIdleCallback?: (callback: () => void) => IdleCallbackHandle;
  cancelIdleCallback?: (handle: IdleCallbackHandle) => void;
};

function applyFocusedSection(
  sections: DreamDetailSectionsState,
  focusSection?: DreamDetailFocusSection,
) {
  if (!focusSection) {
    return sections;
  }

  return {
    ...sections,
    [focusSection]: true,
  };
}

export function useDreamDetailController({
  dreamId,
  justSaved,
  focusSection,
  copy,
  onAcknowledgeSaved,
  onDeleteComplete,
}: UseDreamDetailControllerArgs) {
  const [dream, setDream] = React.useState(() => getDream(dreamId));
  const [showSavedHighlight, setShowSavedHighlight] = React.useState(Boolean(justSaved));
  const [isTranscribingAudio, setIsTranscribingAudio] = React.useState(false);
  const [isEditingTranscript, setIsEditingTranscript] = React.useState(false);
  const [transcriptDraft, setTranscriptDraft] = React.useState('');
  const [expandedSections, setExpandedSections] = React.useState<DreamDetailSectionsState | null>(
    () => (dream ? applyFocusedSection(createDefaultExpandedSections(dream), focusSection) : null),
  );
  const [analysisSettings, setAnalysisSettings] = React.useState<DreamAnalysisSettings>(() =>
    getDreamAnalysisSettings(),
  );
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = React.useState(false);
  const [isDownloadingAudio, setIsDownloadingAudio] = React.useState(false);
  const [relatedDreams, setRelatedDreams] = React.useState<RelatedDream[]>([]);
  const [transcriptionProgress, setTranscriptionProgress] =
    React.useState<DreamTranscriptionProgress | null>(null);

  const refreshDream = React.useCallback(() => {
    const nextDream = getDream(dreamId);
    setDream(nextDream);
    setExpandedSections(
      nextDream
        ? applyFocusedSection(createDefaultExpandedSections(nextDream), focusSection)
        : null,
    );
    setAnalysisSettings(getDreamAnalysisSettings());
    setTranscriptDraft(nextDream?.transcript ?? '');
    setIsTranscribingAudio(false);
    setIsEditingTranscript(false);
    setTranscriptionProgress(null);
    setShowSavedHighlight(Boolean(justSaved));

    if (nextDream) {
      saveLastViewedDream(nextDream.id);
    }
  }, [dreamId, focusSection, justSaved]);

  useFocusEffect(
    React.useCallback(() => {
      refreshDream();

      if (justSaved) {
        onAcknowledgeSaved();
      }

      return () => {
        stop().catch(e => logActionError('useDreamDetailController.stop', e));
      };
    }, [justSaved, onAcknowledgeSaved, refreshDream]),
  );

  React.useEffect(() => {
    if (!dream) {
      setRelatedDreams([]);
      return;
    }

    let cancelled = false;

    const runHydration = () => {
      try {
        const nextRelatedDreams = getRelatedDreams(dream, listDreams());
        React.startTransition(() => {
          if (cancelled) {
            return;
          }

          setRelatedDreams(nextRelatedDreams);
        });
      } catch (e) {
        logActionError('useDreamDetailController.getRelatedDreams', e);
        if (!cancelled) {
          setRelatedDreams([]);
        }
      }
    };

    const scheduler = globalThis as typeof globalThis & IdleSchedulerShape;
    if (typeof scheduler.requestIdleCallback === 'function') {
      const idleHandle = scheduler.requestIdleCallback(runHydration);
      return () => {
        cancelled = true;
        scheduler.cancelIdleCallback?.(idleHandle);
      };
    }

    const timeoutId = setTimeout(runHydration, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [dream]);

  const sections = React.useMemo(
    () =>
      expandedSections ??
      (dream ? createDefaultExpandedSections(dream) : createEmptyDetailSectionsState()),
    [dream, expandedSections],
  );

  const updateSections = React.useCallback(
    (updater: (current: DreamDetailSectionsState) => DreamDetailSectionsState) => {
      setExpandedSections(current => {
        const base =
          current ??
          (dream
            ? applyFocusedSection(createDefaultExpandedSections(dream), focusSection)
            : createEmptyDetailSectionsState());
        return updater(base);
      });
    },
    [dream, focusSection],
  );

  const dismissSavedHighlight = React.useCallback(() => {
    setShowSavedHighlight(false);
  }, []);

  React.useEffect(() => {
    if (!showSavedHighlight) {
      return;
    }

    const timeoutId = setTimeout(() => {
      setShowSavedHighlight(false);
    }, 2600);

    return () => clearTimeout(timeoutId);
  }, [showSavedHighlight]);

  const toggleSection = React.useCallback(
    (section: keyof DreamDetailSectionsState) => {
      updateSections(current => ({
        ...current,
        [section]: !current[section],
      }));
    },
    [updateSections],
  );

  const toggleStateSections = React.useCallback(() => {
    updateSections(current => {
      const nextValue = !(current.context || current.emotions);
      return {
        ...current,
        context: nextValue,
        emotions: nextValue,
      };
    });
  }, [updateSections]);

  const onToggleArchiveDream = React.useCallback(() => {
    if (!dream) {
      return;
    }

    const nextDream =
      typeof dream.archivedAt === 'number' ? unarchiveDream(dreamId) : archiveDream(dreamId);

    if (nextDream) {
      setDream(nextDream);
    }
  }, [dream, dreamId]);

  const onToggleStarDream = React.useCallback(() => {
    if (!dream) {
      return;
    }

    const nextDream =
      typeof dream.starredAt === 'number' ? unstarDream(dreamId) : starDream(dreamId);
    setDream(nextDream);
  }, [dream, dreamId]);

  const onDeleteDream = React.useCallback(() => {
    Alert.alert(
      copy.detailDeleteTitle,
      copy.detailDeleteDescription,
      [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailDeleteConfirm,
          style: 'destructive',
          onPress: () => {
            deleteDream(dreamId);
            clearLastViewedDream(dreamId);
            onDeleteComplete();
          },
        },
      ],
    );
  }, [copy, dreamId, onDeleteComplete]);


  const onTranscribeAudio = React.useCallback(async () => {
    const currentDream = dream;
    if (!currentDream?.audioUri || isTranscribingAudio) {
      return;
    }

    setIsTranscribingAudio(true);
    setTranscriptionProgress({
      phase: 'preparing-model',
      progress: 0,
    });

    try {
      const pendingTranscription = transcribeDreamAudio(dreamId, nextProgress => {
        setTranscriptionProgress(nextProgress);
      });
      setDream(getDream(dreamId));
      await pendingTranscription;
      setDream(getDream(dreamId));
      updateSections(current => ({
        ...current,
        transcript: true,
      }));
      setTranscriptDraft(getDream(dreamId)?.transcript ?? '');
    } catch (error) {
      setDream(getDream(dreamId));
      setTranscriptDraft(getDream(dreamId)?.transcript ?? '');
      const fallbackDescription = copy.detailTranscriptionErrorDescription;
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(copy.detailTranscriptionErrorTitle, `${fallbackDescription}\n${message}`);
    } finally {
      setIsTranscribingAudio(false);
      setTranscriptionProgress(null);
    }
  }, [copy, dream, dreamId, isTranscribingAudio, updateSections]);

  const onStartTranscriptEdit = React.useCallback(() => {
    setTranscriptDraft(dream?.transcript ?? '');
    updateSections(current => ({
      ...current,
      transcript: true,
    }));
    setIsEditingTranscript(true);
  }, [dream?.transcript, updateSections]);

  const onCancelTranscriptEdit = React.useCallback(() => {
    setTranscriptDraft(dream?.transcript ?? '');
    setIsEditingTranscript(false);
  }, [dream?.transcript]);

  const onSaveTranscriptEdit = React.useCallback(() => {
    const nextTranscript = transcriptDraft.trim();
    if (!nextTranscript) {
      Alert.alert(
        copy.detailGeneratedTranscriptEmptyErrorTitle,
        copy.detailGeneratedTranscriptEmptyErrorDescription,
      );
      return;
    }

    const nextDream = saveDreamTranscriptEdit(dreamId, nextTranscript);
    setDream(nextDream);
    setTranscriptDraft(nextDream.transcript ?? '');
    setIsEditingTranscript(false);
    Alert.alert(
      copy.detailGeneratedTranscriptSaveSuccessTitle,
      copy.detailGeneratedTranscriptSaveSuccessDescription,
    );
  }, [copy, dreamId, transcriptDraft]);

  const onClearTranscript = React.useCallback(() => {
    Alert.alert(
      copy.detailGeneratedTranscriptClearTitle,
      copy.detailGeneratedTranscriptClearDescription,
      [
        {
          text: copy.detailDeleteCancel,
          style: 'cancel',
        },
        {
          text: copy.detailGeneratedTranscriptClear,
          style: 'destructive',
          onPress: () => {
            const nextDream = clearDreamTranscript(dreamId);
            setDream(nextDream);
            setTranscriptDraft('');
            setIsEditingTranscript(false);
          },
        },
      ],
    );
  }, [copy, dreamId]);

  const onGenerateAnalysis = React.useCallback(async () => {
    if (isGeneratingAnalysis || !analysisSettings.enabled) {
      return;
    }

    if (analysisSettings.provider === 'openai') {
      Alert.alert(copy.detailAnalysisErrorTitle, copy.detailAnalysisOpenAiUnavailable);
      return;
    }

    updateSections(current => ({
      ...current,
      analysis: true,
    }));
    setIsGeneratingAnalysis(true);

    try {
      await generateDreamAnalysis(dreamId);
      setDream(getDream(dreamId));
    } catch (error) {
      setDream(getDream(dreamId));
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(
        copy.detailAnalysisErrorTitle,
        `${copy.detailAnalysisGenerateErrorDescription}\n${message}`,
      );
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [analysisSettings.enabled, analysisSettings.provider, copy, dreamId, isGeneratingAnalysis, updateSections]);

  const onDownloadAudio = React.useCallback(async () => {
    const remotePath = dream?.audioRemotePath;
    if (!remotePath || isDownloadingAudio) {
      return;
    }

    setIsDownloadingAudio(true);
    try {
      const audioUri = await downloadDreamAudio(remotePath, dreamId);
      const nextDream = setDreamAudioUri(dreamId, audioUri);
      setDream(nextDream);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert(copy.detailAudioDownloadErrorTitle, message);
    } finally {
      setIsDownloadingAudio(false);
    }
  }, [copy, dream?.audioRemotePath, dreamId, isDownloadingAudio]);

  const onClearAnalysis = React.useCallback(() => {
    const nextDream = clearDreamAnalysis(dreamId);
    setDream(nextDream);
  }, [dreamId]);

  return {
    dream,
    relatedDreams,
    showSavedHighlight,
    isTranscribingAudio,
    isEditingTranscript,
    transcriptDraft,
    sections,
    analysisSettings,
    isGeneratingAnalysis,
    transcriptionProgress,
    setTranscriptDraft,
    dismissSavedHighlight,
    toggleSection,
    toggleStateSections,
    onToggleArchiveDream,
    onToggleStarDream,
    onDeleteDream,
    onTranscribeAudio,
    onStartTranscriptEdit,
    onCancelTranscriptEdit,
    onSaveTranscriptEdit,
    onClearTranscript,
    onGenerateAnalysis,
    onClearAnalysis,
    isDownloadingAudio,
    onDownloadAudio,
  };
}
