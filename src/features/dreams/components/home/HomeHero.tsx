import React from 'react';
import { Animated, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../../components/ui/Button';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';

type HomeHeroPrompt = {
  title: string;
  description: string;
  primaryActionLabel: string;
  primaryActionIcon: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: string;
  onSecondaryAction?: () => void;
};

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
  prompt?: HomeHeroPrompt | null;
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
  prompt,
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
      {prompt ? (
        <Animated.View
          pointerEvents="none"
          style={[styles.heroGlowSmall, { opacity: heroGlowOpacity }]}
        />
      ) : null}
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
            {prompt ? (
              <Animated.View
                style={{
                  opacity: heroSubtitleOpacity,
                  transform: [{ translateY: heroSubtitleTranslateY }],
                }}
              >
                <View style={styles.heroPromptCard}>
                  <View style={styles.heroPromptHeader}>
                    <View style={styles.heroPromptIconWrap}>
                      <Ionicons
                        name={prompt.primaryActionIcon}
                        size={16}
                        color="#7CC8FF"
                      />
                    </View>
                    <View style={styles.heroPromptCopy}>
                      <Text style={styles.heroPromptTitle}>{prompt.title}</Text>
                      <Text style={styles.heroPromptDescription}>{prompt.description}</Text>
                    </View>
                  </View>
                  <View style={styles.heroPromptActions}>
                    <Button
                      title={prompt.primaryActionLabel}
                      onPress={prompt.onPrimaryAction}
                      icon={prompt.primaryActionIcon}
                      size="sm"
                      style={styles.heroPromptPrimaryAction}
                    />
                    {prompt.secondaryActionLabel && prompt.onSecondaryAction ? (
                      <Button
                        title={prompt.secondaryActionLabel}
                        onPress={prompt.onSecondaryAction}
                        icon={prompt.secondaryActionIcon}
                        variant="ghost"
                        size="sm"
                        style={styles.heroPromptSecondaryAction}
                      />
                    ) : null}
                  </View>
                </View>
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
      </View>
    </Animated.View>
  );
}
