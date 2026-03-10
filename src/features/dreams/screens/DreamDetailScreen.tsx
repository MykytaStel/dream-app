import React from 'react';
import { Pressable, View } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import {
  getDreamCopy,
  getDreamMoodLabels,
  getDreamPreSleepEmotionLabels,
  getDreamStressLabels,
  getDreamWakeEmotionLabels,
} from '../../../constants/copy/dreams';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { DreamDetailOverview } from '../components/DreamDetailOverview';
import { DreamDetailSections } from '../components/DreamDetailSections';
import { useDreamDetailController } from '../hooks/useDreamDetailController';
import { getDreamDetailViewModel } from '../model/dreamDetailPresentation';
import {
  createDreamDetailScreenStyles,
} from './DreamDetailScreen.styles';

export default function DreamDetailScreen() {
  const theme = useTheme<Theme>();
  const { locale } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.DreamDetail>>();

  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const moodLabels = React.useMemo(() => getDreamMoodLabels(locale), [locale]);
  const stressLabels = React.useMemo(() => getDreamStressLabels(locale), [locale]);
  const wakeEmotionLabels = React.useMemo(() => getDreamWakeEmotionLabels(locale), [locale]);
  const preSleepEmotionLabels = React.useMemo(
    () => getDreamPreSleepEmotionLabels(locale),
    [locale],
  );
  const styles = React.useMemo(() => createDreamDetailScreenStyles(theme), [theme]);

  const controller = useDreamDetailController({
    dreamId: route.params.dreamId,
    justSaved: Boolean(route.params.justSaved),
    copy,
    onAcknowledgeSaved: () => {
      navigation.setParams({
        justSaved: false,
      });
    },
    onDeleteComplete: () => {
      navigation.goBack();
    },
  });

  const viewModel = React.useMemo(
    () =>
      controller.dream
        ? getDreamDetailViewModel({
            dream: controller.dream,
            copy,
            moodLabels,
            analysisSettings: controller.analysisSettings,
            relatedDreams: controller.relatedDreams,
            isTranscribingAudio: controller.isTranscribingAudio,
          })
        : null,
    [
      controller.analysisSettings,
      controller.dream,
      controller.isTranscribingAudio,
      controller.relatedDreams,
      copy,
      moodLabels,
    ],
  );

  if (!controller.dream || !viewModel) {
    return (
      <ScreenContainer scroll>
        <Card style={styles.heroCard}>
          <View pointerEvents="none" style={styles.heroGlowLarge} />
          <View pointerEvents="none" style={styles.heroGlowSmall} />
          <Pressable
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            accessibilityLabel={copy.detailBack}
          >
            <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
          </Pressable>
          <SectionHeader
            title={copy.detailMissingTitle}
            subtitle={copy.detailMissingDescription}
            large
          />
        </Card>
      </ScreenContainer>
    );
  }

  const dream = controller.dream;

  return (
    <ScreenContainer scroll>
      <DreamDetailOverview
        dream={dream}
        copy={copy}
        styles={styles}
        viewModel={viewModel}
        showSavedHighlight={controller.showSavedHighlight}
        onDismissSavedHighlight={controller.dismissSavedHighlight}
        onBack={() => navigation.goBack()}
        onEditDream={() =>
          navigation.navigate(ROOT_ROUTE_NAMES.DreamEditor, {
            dreamId: dream.id,
          })
        }
        onDeleteDream={controller.onDeleteDream}
        onToggleStarDream={controller.onToggleStarDream}
        onToggleArchiveDream={controller.onToggleArchiveDream}
      />

      <DreamDetailSections
        dream={dream}
        copy={copy}
        styles={styles}
        viewModel={viewModel}
        relatedDreams={controller.relatedDreams}
        sections={controller.sections}
        isPlayingAudio={controller.isPlayingAudio}
        isTranscribingAudio={controller.isTranscribingAudio}
        isEditingTranscript={controller.isEditingTranscript}
        transcriptDraft={controller.transcriptDraft}
        transcriptionProgress={controller.transcriptionProgress}
        analysisSettings={controller.analysisSettings}
        isGeneratingAnalysis={controller.isGeneratingAnalysis}
        stressLabels={stressLabels}
        wakeEmotionLabels={wakeEmotionLabels}
        preSleepEmotionLabels={preSleepEmotionLabels}
        setTranscriptDraft={controller.setTranscriptDraft}
        onToggleSection={controller.toggleSection}
        onToggleStateSections={controller.toggleStateSections}
        onStartTranscriptEdit={controller.onStartTranscriptEdit}
        onCancelTranscriptEdit={controller.onCancelTranscriptEdit}
        onSaveTranscriptEdit={controller.onSaveTranscriptEdit}
        onClearTranscript={controller.onClearTranscript}
        onTranscribeAudio={controller.onTranscribeAudio}
        onGenerateAnalysis={controller.onGenerateAnalysis}
        onClearAnalysis={controller.onClearAnalysis}
        onToggleAudioPlayback={controller.onToggleAudioPlayback}
        onOpenRelatedDream={dreamId =>
          navigation.push(ROOT_ROUTE_NAMES.DreamDetail, {
            dreamId,
          })
        }
        onOpenSettingsForAnalysis={() =>
          navigation.navigate(ROOT_ROUTE_NAMES.Tabs, {
            screen: TAB_ROUTE_NAMES.Settings,
          })
        }
      />
    </ScreenContainer>
  );
}
