import { StyleSheet } from 'react-native';
import { hexToRgba } from '../../../theme/color';
import { fontFamilies } from '../../../theme/fonts';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';
import { getDreamLayout } from '../constants/layout';

export function createHomeHeroStyles(theme: Theme) {
  const layout = getDreamLayout(theme);
  return StyleSheet.create({
    heroCard: {
      gap: 8,
      overflow: 'hidden',
      padding: 14,
      position: 'relative',
      marginBottom: 2,
    },
    heroFrame: {
      justifyContent: 'flex-start',
      gap: 10,
      position: 'relative',
      zIndex: 1,
      paddingBottom: 2,
    },
    /**
     * Fully inside the card, because the card clips.
     *
     * This sat at `top: -4, right: -10` under an `overflow: hidden` parent, so
     * what rendered was never a circle — it was the arc left after the corner
     * cut it. A soft shape bleeding off an edge is a real technique, but it
     * needs the edge to be the frame; here the frame is a rounded card, and a
     * circle sliced by it reads as a mistake rather than as depth.
     */
    heroGlowLarge: {
      position: 'absolute',
      width: 104,
      height: 104,
      borderRadius: 999,
      backgroundColor: theme.colors.auroraMid,
      opacity: 0.1,
      right: 8,
      zIndex: 0,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 18,
      position: 'relative',
      zIndex: 1,
    },
    heroCopy: {
      flex: 1,
      gap: layout.rowGap,
      paddingRight: 10,
      minWidth: 0,
      zIndex: 2,
    },
    heroMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    heroDateRow: {
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },
    heroPromptCard: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 16,
        paddingVertical: 10,
        paddingHorizontal: 10,
      }),
      marginTop: 4,
      gap: 10,
      position: 'relative',
      zIndex: 3,
      elevation: 2,
    },
    heroPromptHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    heroPromptIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.primary}24`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}2E`,
    },
    heroPromptCopy: {
      flex: 1,
      gap: 3,
      minWidth: 0,
    },
    heroPromptDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    heroPromptActions: {
      gap: 8,
    },
    heroPromptPrimaryAction: {
      width: '100%',
    },
    heroPromptSecondaryAction: {
      width: '100%',
    },
    heroShortcutButton: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 8,
        paddingHorizontal: 10,
      }),
      marginTop: 2,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      maxWidth: '100%',
      position: 'relative',
      zIndex: 3,
      elevation: 2,
    },
    heroShortcutButtonPressed: {
      opacity: 0.94,
      transform: [{ scale: 0.992 }],
    },
    heroShortcutIconWrap: {
      width: 30,
      height: 30,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `${theme.colors.primary}24`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}2E`,
    },
    heroShortcutCopy: {
      flex: 1,
      gap: 1,
      minWidth: 0,
    },
    heroShortcutLabel: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.45,
    },
    heroShortcutTitle: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 17,
      fontWeight: '700',
    },
    heroShortcutMeta: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    heroShortcutIcon: {
      color: theme.colors.accent,
    },
    heroEyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.7,
      textTransform: 'uppercase',
    },
    heroDateChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 9,
        paddingVertical: 5,
      }),
    },
    heroDateChipLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    heroStreakChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 9,
        paddingVertical: 5,
      }),
    },
    heroStreakChipMilestone: {
      backgroundColor: `${theme.colors.auroraMid}22`,
      borderColor: `${theme.colors.auroraMid}44`,
    },
    heroStreakChipText: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    heroStreakChipTextMilestone: {
      color: theme.colors.auroraMid,
    },
    heroTitle: {
      fontFamily: fontFamilies.display,
      fontSize: 24,
      lineHeight: 28,
      fontWeight: '700',
      flexShrink: 1,
      includeFontPadding: false,
    },
    heroSubtitle: {
      color: theme.colors.textDim,
      lineHeight: 18,
      fontSize: 13,
      flexShrink: 1,
      maxWidth: '100%',
    },
    heroVisualShell: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: hexToRgba(theme.colors.surfaceAlt, 0.82),
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: theme.colors.primaryAlt,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
      elevation: 3,
      marginTop: 4,
      marginRight: 4,
      zIndex: 1,
    },
    heroFacet: {
      position: 'absolute',
      width: 16,
      height: 16,
      borderRadius: 6,
      transform: [{ rotate: '45deg' }],
    },
    heroFacetPrimary: {
      top: 10,
      backgroundColor: theme.colors.primary,
    },
    heroFacetAccent: {
      left: 11,
      bottom: 12,
      backgroundColor: theme.colors.accent,
    },
    heroFacetAlt: {
      right: 11,
      bottom: 12,
      backgroundColor: theme.colors.auroraMid,
    },
    heroFooter: {
      gap: 8,
    },
  });
}
