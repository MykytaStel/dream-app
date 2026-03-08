import React from 'react';
import { Animated, Pressable, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';

type HomeHeroProps = {
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  scrollY: Animated.Value;
  insetTop: number;
  expandedHeight: number;
  collapsedHeight: number;
  collapseDistance: number;
  greeting: string;
  dateLabel: string;
  streak: number;
  totalDreams: number;
  averageWords: number;
  lastViewedDreamTitle?: string | null;
  lastViewedDreamMeta?: string | null;
  onOpenLastDream?: (() => void) | null;
};

export function HomeHero({
  copy,
  styles,
  scrollY,
  insetTop,
  expandedHeight,
  collapsedHeight,
  collapseDistance,
  greeting,
  dateLabel,
  streak,
  totalDreams,
  averageWords,
  lastViewedDreamTitle,
  lastViewedDreamMeta,
  onOpenLastDream,
}: HomeHeroProps) {
  const heroHeight = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [expandedHeight + insetTop, collapsedHeight + insetTop],
    extrapolate: 'clamp',
  });
  const heroVisualScale = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [1, 0.78],
    extrapolate: 'clamp',
  });
  const heroVisualTranslateY = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [0, -8],
    extrapolate: 'clamp',
  });
  const heroSubtitleOpacity = scrollY.interpolate({
    inputRange: [0, collapseDistance * 0.55, collapseDistance],
    outputRange: [1, 0.24, 0],
    extrapolate: 'clamp',
  });
  const heroSubtitleTranslateY = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [0, -10],
    extrapolate: 'clamp',
  });
  const heroStatsTranslateY = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [0, -6],
    extrapolate: 'clamp',
  });
  const heroStatsOpacity = scrollY.interpolate({
    inputRange: [0, collapseDistance * 0.8, collapseDistance],
    outputRange: [1, 0.94, 0.82],
    extrapolate: 'clamp',
  });
  const heroGlowOpacity = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [1, 0.35],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.heroOverlay,
        {
          height: heroHeight,
          paddingTop: insetTop,
        },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[styles.heroGlowLarge, { opacity: heroGlowOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.heroGlowSmall, { opacity: heroGlowOpacity }]}
      />
      <View style={styles.heroFrame}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroEyebrow}>{copy.homeTitle}</Text>
            </View>
            <Text style={styles.heroTitle}>{greeting}</Text>
            <Animated.View
              style={{
                opacity: heroSubtitleOpacity,
                transform: [{ translateY: heroSubtitleTranslateY }],
              }}
            >
              <Text style={styles.heroSubtitle}>{copy.homeSubtitle}</Text>
            </Animated.View>
            <View style={styles.heroDateRow}>
              <View style={styles.heroDateChip}>
                <Text style={styles.heroDateChipLabel}>{dateLabel}</Text>
              </View>
            </View>
            {lastViewedDreamTitle && onOpenLastDream ? (
              <Animated.View
                style={{
                  opacity: heroSubtitleOpacity,
                  transform: [{ translateY: heroSubtitleTranslateY }],
                }}
              >
                <Pressable
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
                      color="#7CC8FF"
                    />
                  </View>
                  <View style={styles.heroShortcutCopy}>
                    <Text style={styles.heroShortcutLabel}>{copy.homeLastDreamLabel}</Text>
                    <Text style={styles.heroShortcutTitle} numberOfLines={1}>
                      {lastViewedDreamTitle}
                    </Text>
                    {lastViewedDreamMeta ? (
                      <Text style={styles.heroShortcutMeta} numberOfLines={1}>
                        {lastViewedDreamMeta}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              </Animated.View>
            ) : null}
          </View>
          <Animated.View
            style={[
              styles.heroVisualShell,
              {
                transform: [{ scale: heroVisualScale }, { translateY: heroVisualTranslateY }],
              },
            ]}
          >
            <View style={[styles.heroFacet, styles.heroFacetPrimary]} />
            <View style={[styles.heroFacet, styles.heroFacetAccent]} />
            <View style={[styles.heroFacet, styles.heroFacetAlt]} />
          </Animated.View>
        </View>

        <Animated.View
          style={[
            styles.heroFooter,
            {
              opacity: heroStatsOpacity,
              transform: [{ translateY: heroStatsTranslateY }],
            },
          ]}
        >
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{copy.homeStreakLabel}</Text>
              <Text style={styles.statValue}>{`${streak} ${copy.homeDaysUnit}`}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{copy.homeTotalLabel}</Text>
              <Text style={styles.statValue}>{totalDreams}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statLabel}>{copy.homeAverageLabel}</Text>
              <Text style={styles.statValue}>{averageWords}</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
