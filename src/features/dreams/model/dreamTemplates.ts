import { Mood, WakeEmotion } from './dream';

export type DreamTemplate = {
  id: string;
  icon: string;
  tags: string[];
  mood?: Mood;
  wakeEmotions?: WakeEmotion[];
  opensMoodSection: boolean;
};

// Pure data — labels are resolved from copy in the UI layer
export const DREAM_TEMPLATE_DEFINITIONS: DreamTemplate[] = [
  {
    id: 'lucid',
    icon: 'eye-outline',
    tags: ['lucid'],
    mood: 'positive',
    wakeEmotions: ['curious', 'inspired'],
    opensMoodSection: true,
  },
  {
    id: 'nightmare',
    icon: 'warning-outline',
    tags: ['nightmare'],
    mood: 'negative',
    wakeEmotions: ['uneasy', 'heavy'],
    opensMoodSection: true,
  },
  {
    id: 'vivid',
    icon: 'color-palette-outline',
    tags: ['vivid'],
    mood: 'positive',
    wakeEmotions: ['inspired'],
    opensMoodSection: true,
  },
  {
    id: 'recurring',
    icon: 'repeat-outline',
    tags: ['recurring'],
    wakeEmotions: ['curious'],
    opensMoodSection: false,
  },
  {
    id: 'fragment',
    icon: 'puzzle-outline',
    tags: ['fragment'],
    opensMoodSection: false,
  },
  {
    id: 'peaceful',
    icon: 'moon-outline',
    tags: ['peaceful'],
    mood: 'positive',
    wakeEmotions: ['calm'],
    opensMoodSection: true,
  },
];
