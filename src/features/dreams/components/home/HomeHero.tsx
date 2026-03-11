import React from 'react';
import { View } from 'react-native';
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
  insetTop: number;
  greeting: string;
  dateLabel: string;
  prompt?: HomeHeroPrompt | null;
};

export function HomeHero({
  copy,
  styles,
  insetTop,
  greeting,
  dateLabel,
  prompt,
}: HomeHeroProps) {
  return (
    <View
      style={[
        styles.heroCard,
        {
          paddingTop: insetTop,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.heroGlowLarge} />
      {prompt ? <View pointerEvents="none" style={styles.heroGlowSmall} /> : null}
      <View style={styles.heroFrame}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroCopy}>
            <View style={styles.heroMetaRow}>
              <Text style={styles.heroEyebrow}>{copy.homeTitle}</Text>
            </View>
            <Text style={styles.heroTitle}>{greeting}</Text>
            <Text style={styles.heroSubtitle}>{copy.homeSubtitle}</Text>
            <View style={styles.heroDateRow}>
              <View style={styles.heroDateChip}>
                <Text style={styles.heroDateChipLabel}>{dateLabel}</Text>
              </View>
            </View>
            {prompt ? (
              <View style={styles.heroPromptCard}>
                <View style={styles.heroPromptHeader}>
                  <View style={styles.heroPromptIconWrap}>
                    <Ionicons name={prompt.primaryActionIcon} size={16} color="#7CC8FF" />
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
            ) : null}
          </View>
          <View style={styles.heroVisualShell}>
            <View style={[styles.heroFacet, styles.heroFacetPrimary]} />
            <View style={[styles.heroFacet, styles.heroFacetAccent]} />
            <View style={[styles.heroFacet, styles.heroFacetAlt]} />
          </View>
        </View>
      </View>
    </View>
  );
}
