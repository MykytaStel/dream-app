import React from 'react';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { logActionError } from '../../../app/errorReporting';
import {
  AnalysisSection,
  TranscriptionSection,
} from '../components/SettingsAdvancedSections';
import { useSettingsSpoke } from './useSettingsSpoke';

/**
 * What the app does with a dream once it has one.
 *
 * Analysis and transcription are here together because they are the same
 * subject from the person's side — the app reading what they recorded — even
 * though one is a preference and the other is a two-hundred-megabyte download.
 * The download is the reason this is a screen rather than a section: it needs
 * room to explain itself, and it was the last thing in a nine-section scroll.
 */
export default function SettingsAnalysisScreen() {
  const { copy, styles, controller } = useSettingsSpoke();

  return (
    <ScreenContainer scroll withTopInset={false}>
      <AnalysisSection
        copy={copy}
        styles={styles}
        analysisSettings={controller.analysisSettings}
        onSave={controller.saveNextAnalysisSettings}
      />

      <TranscriptionSection
        copy={copy}
        styles={styles}
        highlights={controller.transcriptionHighlights}
        isDownloading={controller.isDownloadingTranscriptionModel}
        isDeleting={controller.isDeletingTranscriptionModel}
        downloadLabel={controller.transcriptionDownloadLabel}
        installed={controller.transcriptionModelInstalled}
        onDownload={() =>
          controller
            .onDownloadTranscriptionModel()
            .catch(e =>
              logActionError(
                'SettingsAnalysisScreen.onDownloadTranscriptionModel',
                e,
              ),
            )
        }
        onDelete={() =>
          controller
            .onDeleteTranscriptionModel()
            .catch(e =>
              logActionError(
                'SettingsAnalysisScreen.onDeleteTranscriptionModel',
                e,
              ),
            )
        }
      />
    </ScreenContainer>
  );
}
