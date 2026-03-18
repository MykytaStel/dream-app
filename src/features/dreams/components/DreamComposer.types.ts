import {
  getDreamCopy,
  getDreamIntensityLevels,
  getDreamMoods,
  getDreamPreSleepEmotions,
  getDreamStressLevels,
  getDreamWakeEmotions,
} from '../../../constants/copy/dreams';
import { createNewDreamScreenStyles } from '../screens/NewDreamScreen.styles';
import { Dream } from '../model/dream';

export type DreamComposerMode = 'create' | 'edit';
export type DreamComposerEntryMode = 'default' | 'voice' | 'wake';

export type DreamComposerProps = {
  mode: DreamComposerMode;
  entryMode?: DreamComposerEntryMode;
  initialDream?: Dream;
  onSaved?: (dream: Dream) => void;
  autoStartRecordingKey?: number;
};

export type DreamComposerStyles = ReturnType<typeof createNewDreamScreenStyles>;
export type DreamComposerCopy = ReturnType<typeof getDreamCopy>;
export type DreamComposerMoodOption = ReturnType<typeof getDreamMoods>[number];
export type DreamComposerIntensityOption = ReturnType<typeof getDreamIntensityLevels>[number];
export type DreamComposerStressOption = ReturnType<typeof getDreamStressLevels>[number];
export type DreamComposerWakeEmotionOption = ReturnType<typeof getDreamWakeEmotions>[number];
export type DreamComposerPreSleepEmotionOption = ReturnType<
  typeof getDreamPreSleepEmotions
>[number];
