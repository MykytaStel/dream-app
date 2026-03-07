import { Theme } from './theme';

type SurfaceTone = 'surface' | 'alt' | 'elevated' | 'background';

type PillOptions = {
  tone?: SurfaceTone;
  paddingVertical?: number;
  paddingHorizontal?: number;
};

type TileOptions = {
  tone?: Exclude<SurfaceTone, 'background'>;
  radius?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
};

function resolveSurfaceColor(theme: Theme, tone: SurfaceTone) {
  switch (tone) {
    case 'alt':
      return theme.colors.surfaceAlt;
    case 'elevated':
      return theme.colors.surfaceElevated;
    case 'background':
      return theme.colors.background;
    case 'surface':
    default:
      return theme.colors.surface;
  }
}

export function createControlPill(theme: Theme, options: PillOptions = {}) {
  const {
    tone = 'surface',
    paddingVertical = 7,
    paddingHorizontal = 11,
  } = options;

  return {
    borderRadius: theme.borderRadii.pill,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: resolveSurfaceColor(theme, tone),
    paddingVertical,
    paddingHorizontal,
  } as const;
}

export function createSoftTile(theme: Theme, options: TileOptions = {}) {
  const {
    tone = 'alt',
    radius = 14,
    paddingVertical,
    paddingHorizontal,
  } = options;

  return {
    borderRadius: radius,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: resolveSurfaceColor(theme, tone),
    ...(typeof paddingVertical === 'number' ? { paddingVertical } : null),
    ...(typeof paddingHorizontal === 'number' ? { paddingHorizontal } : null),
  } as const;
}

export function createFieldSurface(theme: Theme) {
  return {
    ...createSoftTile(theme, {
      tone: 'alt',
      radius: 12,
      paddingVertical: 12,
      paddingHorizontal: 12,
    }),
  } as const;
}
