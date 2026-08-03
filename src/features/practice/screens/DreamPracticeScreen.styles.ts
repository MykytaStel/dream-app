import { StyleSheet } from 'react-native';
import { hexToRgba } from '../../../theme/color';
import { Theme } from '../../../theme/theme';

/**
 * Styles for the practice screen, in the file the convention puts them in.
 *
 * Every other screen here keeps its styles in a sibling `.styles.ts`; this one
 * had both of its factories inline, which was a hundred and eleven lines of the
 * component file that no reader of the component ever needs to scroll past.
 */

export function createPracticeCardStyles(theme: Theme) {
  return StyleSheet.create({
    stack: { gap: 10 },
    stackTight: { gap: 4 },
    stackSteps: { gap: 8 },
    row: { flexDirection: 'row', gap: 8 },
    rowSteps: { flexDirection: 'row', gap: 10 },
    rowChecklist: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontWeight: '700' },
    titleSteps: { fontWeight: '700', fontSize: 14 },
    value: { fontSize: 12, opacity: 0.8 },
    hint: { fontSize: 12, opacity: 0.7 },
    stepBullet: {
      width: 22,
      height: 22,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: hexToRgba(theme.colors.success, 0.14),
    },
    stepBulletLabel: { fontSize: 12, fontWeight: '700' },
    stepText: { flex: 1, fontSize: 13, lineHeight: 20 },
    checklistDot: { width: 10, height: 10, borderRadius: 999 },
    checklistDotOn: { backgroundColor: theme.colors.success },
    checklistDotOff: { backgroundColor: hexToRgba(theme.colors.text, 0.18) },
    checklistLabel: { flex: 1, fontSize: 13 },
    metricCard: {
      // Two across, not three. At a third of a phone a tile is about 100pt
      // wide, and "Controlled dreams" and "No technique logged yet" are simply
      // longer than that — no amount of wrapping makes three columns readable
      // here, so the third tile drops to its own row.
      flexBasis: '47%',
      flexGrow: 1,
      // React Native defaults flexShrink to 0, unlike the web. Without this a
      // tile refuses to go narrower than its longest line, so a value like
      // "No technique logged yet" pushed the whole row past the card and off
      // the screen instead of wrapping inside its own tile.
      flexShrink: 1,
      gap: 6,
      padding: 12,
      borderRadius: 16,
      backgroundColor: hexToRgba(theme.colors.text, 0.04),
      borderWidth: 1,
      borderColor: hexToRgba(theme.colors.text, 0.08),
    },
    // Both need flexShrink because React Native defaults it to 0: a Text in a
    // flex column keeps its intrinsic width and is clipped by the parent
    // rather than wrapping to it, which is why these read "Controlled dream"
    // and "No technique lo".
    metricLabel: { fontSize: 12, opacity: 0.7, flexShrink: 1 },
    metricValue: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  });
}

export function createDreamPracticeScreenStyles(theme: Theme) {
  return StyleSheet.create({
    heroCard: {
      gap: 18,
      overflow: 'hidden',
      backgroundColor: theme.colors.surfaceElevated,
    },
    sectionCard: {
      gap: 16,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
    },
    buttonRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    checklistRow: {
      gap: 10,
    },
    listBlock: {
      gap: 8,
    },
    flowGrid: {
      gap: 18,
    },
    listItem: {
      color: theme.colors.text,
      fontSize: 13,
      lineHeight: 20,
    },
    reminderGrid: {
      gap: 16,
    },
    metricGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    supportLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      fontWeight: '700',
    },
    tagWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tagChip: {
      borderRadius: 999,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: `${theme.colors.primary}20`,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}44`,
    },
    tagLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
    emptyHint: {
      color: theme.colors.textDim,
      fontSize: 13,
    },
  });
}
