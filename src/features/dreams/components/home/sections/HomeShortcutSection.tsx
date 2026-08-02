import React from 'react';
import { Pressable, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../../../components/ui/Text';
import type { Theme } from '../../../../../theme/theme';
import type { DreamCopy } from '../../../../../constants/copy/dreams';
import type { createHomeScreenStyles } from '../../../screens/HomeScreen.styles';

/**
 * The row of ways back in: the last dream opened, and the two practices.
 *
 * Lifted out of `HomeListHeader`, where it was a `useMemo` that built JSX and
 * returned it as a value. That shape is what hid it — a section with no name to
 * search for, no prop list, and no boundary, in the middle of an
 * eight-hundred-line component.
 *
 * The props are its old dependency array, which had been carrying the answer
 * all along.
 */

type HomeShortcutSectionProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  showLastViewedShortcut: boolean;
  lastViewedDreamTitle?: string | null;
  lastViewedDreamMeta?: string | null;
  practiceShortcutTitle?: string;
  practiceShortcutHint?: string;
  nightmareShortcutTitle?: string;
  nightmareShortcutHint?: string;
  onOpenLastDream?: (() => void) | null;
  onOpenPractice?: (() => void) | null;
  onOpenNightmarePractice?: (() => void) | null;
};

export function HomeShortcutSection({
  copy,
  styles,
  showLastViewedShortcut,
  lastViewedDreamTitle,
  lastViewedDreamMeta,
  practiceShortcutTitle,
  practiceShortcutHint,
  nightmareShortcutTitle,
  nightmareShortcutHint,
  onOpenLastDream,
  onOpenPractice,
  onOpenNightmarePractice,
}: HomeShortcutSectionProps) {
  const t = useTheme<Theme>();

  const shortcuts: React.ReactNode[] = [];

  if (showLastViewedShortcut) {
    shortcuts.push(
      <Pressable
        accessibilityRole="button"
        key="last-viewed"
        onPress={onOpenLastDream}
        style={({ pressed }) => [
          styles.heroShortcutButton,
          pressed ? styles.heroShortcutButtonPressed : null,
        ]}
      >
        <View style={styles.heroShortcutIconWrap}>
          <Ionicons
            name="return-up-forward-outline"
            size={15}
            color={t.colors.primary}
          />
        </View>
        <View style={styles.heroShortcutCopy}>
          <Text style={styles.heroShortcutLabel}>
            {copy.homeLastDreamLabel}
          </Text>
          <Text style={styles.heroShortcutTitle} numberOfLines={1}>
            {lastViewedDreamTitle}
          </Text>
          {lastViewedDreamMeta ? (
            <Text style={styles.heroShortcutMeta} numberOfLines={1}>
              {lastViewedDreamMeta}
            </Text>
          ) : null}
        </View>
      </Pressable>,
    );
  }

  if (practiceShortcutTitle && onOpenPractice) {
    shortcuts.push(
      <Pressable
        accessibilityRole="button"
        key="practice"
        onPress={onOpenPractice}
        style={({ pressed }) => [
          styles.heroShortcutButton,
          pressed ? styles.heroShortcutButtonPressed : null,
        ]}
      >
        <View style={styles.heroShortcutIconWrap}>
          <Ionicons
            name="sparkles-outline"
            size={15}
            color={t.colors.primary}
          />
        </View>
        <View style={styles.heroShortcutCopy}>
          <Text style={styles.heroShortcutLabel}>{practiceShortcutTitle}</Text>
          {practiceShortcutHint ? (
            <Text style={styles.heroShortcutMeta} numberOfLines={2}>
              {practiceShortcutHint}
            </Text>
          ) : null}
        </View>
      </Pressable>,
    );
  }

  if (nightmareShortcutTitle && onOpenNightmarePractice) {
    shortcuts.push(
      <Pressable
        accessibilityRole="button"
        key="nightmare-practice"
        onPress={onOpenNightmarePractice}
        style={({ pressed }) => [
          styles.heroShortcutButton,
          pressed ? styles.heroShortcutButtonPressed : null,
        ]}
      >
        <View style={styles.heroShortcutIconWrap}>
          <Ionicons name="water-outline" size={15} color={t.colors.primary} />
        </View>
        <View style={styles.heroShortcutCopy}>
          <Text style={styles.heroShortcutLabel}>{nightmareShortcutTitle}</Text>
          {nightmareShortcutHint ? (
            <Text style={styles.heroShortcutMeta} numberOfLines={2}>
              {nightmareShortcutHint}
            </Text>
          ) : null}
        </View>
      </Pressable>,
    );
  }

  if (!shortcuts.length) {
    return null;
  }

  return <View style={styles.homeModuleStack}>{shortcuts}</View>;
}
