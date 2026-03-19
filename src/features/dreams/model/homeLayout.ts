export const HOME_LAYOUT_SECTIONS = [
  'shortcuts',
  'spotlight',
  'weeklyPatterns',
] as const;

export type HomeLayoutSection = (typeof HOME_LAYOUT_SECTIONS)[number];
export type HomeLayoutPreset = 'balanced' | 'calm' | 'insight';

export type HomeLayoutPreferences = {
  preset: HomeLayoutPreset;
  sectionOrder: HomeLayoutSection[];
  hiddenSections: HomeLayoutSection[];
};

const HOME_LAYOUT_PRESET_VALUES: HomeLayoutPreset[] = [
  'balanced',
  'calm',
  'insight',
];

const HOME_LAYOUT_PRESET_CONFIGS: Record<
  HomeLayoutPreset,
  Omit<HomeLayoutPreferences, 'preset'>
> = {
  balanced: {
    sectionOrder: ['shortcuts', 'spotlight', 'weeklyPatterns'],
    hiddenSections: [],
  },
  calm: {
    sectionOrder: ['shortcuts', 'spotlight', 'weeklyPatterns'],
    hiddenSections: ['spotlight', 'weeklyPatterns'],
  },
  insight: {
    sectionOrder: ['spotlight', 'weeklyPatterns', 'shortcuts'],
    hiddenSections: [],
  },
};

export const DEFAULT_HOME_LAYOUT_PREFERENCES = getHomeLayoutPreferencesForPreset(
  'balanced',
);

export function isHomeLayoutPreset(value: unknown): value is HomeLayoutPreset {
  return (
    typeof value === 'string' &&
    HOME_LAYOUT_PRESET_VALUES.includes(value as HomeLayoutPreset)
  );
}

export function isHomeLayoutSection(value: unknown): value is HomeLayoutSection {
  return (
    typeof value === 'string' &&
    HOME_LAYOUT_SECTIONS.includes(value as HomeLayoutSection)
  );
}

export function getHomeLayoutPreferencesForPreset(
  preset: HomeLayoutPreset,
): HomeLayoutPreferences {
  const config = HOME_LAYOUT_PRESET_CONFIGS[preset];

  return {
    preset,
    sectionOrder: [...config.sectionOrder],
    hiddenSections: [...config.hiddenSections],
  };
}

export function sanitizeHomeLayoutPreferences(
  value: unknown,
): HomeLayoutPreferences {
  if (!value || typeof value !== 'object') {
    return getHomeLayoutPreferencesForPreset('balanced');
  }

  const nextValue = value as Partial<HomeLayoutPreferences>;
  const preset = isHomeLayoutPreset(nextValue.preset)
    ? nextValue.preset
    : 'balanced';
  const presetDefaults = getHomeLayoutPreferencesForPreset(preset);

  return {
    preset,
    sectionOrder: normalizeSectionOrder(
      nextValue.sectionOrder,
      presetDefaults.sectionOrder,
    ),
    hiddenSections: normalizeSections(
      nextValue.hiddenSections,
      presetDefaults.hiddenSections,
    ),
  };
}

export function moveHomeLayoutSection(
  preferences: HomeLayoutPreferences,
  section: HomeLayoutSection,
  direction: 'up' | 'down',
): HomeLayoutPreferences {
  const index = preferences.sectionOrder.indexOf(section);
  if (index < 0) {
    return preferences;
  }

  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (
    targetIndex < 0 ||
    targetIndex >= preferences.sectionOrder.length ||
    targetIndex === index
  ) {
    return preferences;
  }

  const nextOrder = [...preferences.sectionOrder];
  const [removed] = nextOrder.splice(index, 1);
  nextOrder.splice(targetIndex, 0, removed);

  return {
    ...preferences,
    sectionOrder: nextOrder,
  };
}

export function toggleHomeLayoutSectionVisibility(
  preferences: HomeLayoutPreferences,
  section: HomeLayoutSection,
): HomeLayoutPreferences {
  const isHidden = preferences.hiddenSections.includes(section);

  return {
    ...preferences,
    hiddenSections: isHidden
      ? preferences.hiddenSections.filter(key => key !== section)
      : [...preferences.hiddenSections, section],
  };
}

function normalizeSections(
  value: unknown,
  fallback: HomeLayoutSection[],
): HomeLayoutSection[] {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const uniqueSections = new Set<HomeLayoutSection>();

  value.forEach(section => {
    if (isHomeLayoutSection(section)) {
      uniqueSections.add(section);
    }
  });

  return [...uniqueSections];
}

function normalizeSectionOrder(
  value: unknown,
  fallback: HomeLayoutSection[],
): HomeLayoutSection[] {
  const orderedSections = normalizeSections(value, fallback);
  const nextOrder = orderedSections.length ? orderedSections : [...fallback];

  HOME_LAYOUT_SECTIONS.forEach(section => {
    if (!nextOrder.includes(section)) {
      nextOrder.push(section);
    }
  });

  return nextOrder;
}
