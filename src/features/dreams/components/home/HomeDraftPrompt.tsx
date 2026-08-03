import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../../components/ui/Button';
import { Text } from '../../../../components/ui/Text';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';
import { Theme } from '../../../../theme/theme';

/**
 * "You left a draft" — a card of its own, next to the other things the home
 * screen offers to do.
 *
 * It used to live inside the greeting card, in the same column as the date, so
 * it stopped where that column stopped: inset by the greeting card's padding
 * while every card below it ran the full width. Nothing marked the greeting
 * card's edges strongly enough for that nesting to read as nesting, so the one
 * card someone is most likely to press looked misaligned.
 *
 * It is a sibling now, which is also the truer description — resuming a draft
 * is an action like practising lucidity or grounding after a nightmare, not a
 * detail of the greeting.
 */
export type HomeDraftPromptModel = {
  description: string;
  primaryActionLabel: string;
  primaryActionIcon: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: string;
  onSecondaryAction?: () => void;
};

type HomeDraftPromptProps = {
  styles: ReturnType<typeof createHomeScreenStyles>;
  prompt?: HomeDraftPromptModel | null;
};

export const HomeDraftPrompt = React.memo(function HomeDraftPrompt({
  styles,
  prompt,
}: HomeDraftPromptProps) {
  const t = useTheme<Theme>();

  if (!prompt) {
    return null;
  }

  return (
    <View style={styles.heroPromptCard}>
      <View style={styles.heroPromptHeader}>
        <View style={styles.heroPromptIconWrap}>
          <Ionicons
            name={prompt.primaryActionIcon}
            size={16}
            color={t.colors.primary}
          />
        </View>
        {/*
          No title. It was the button's own label printed a second time, three
          lines above the button. The description says what the draft is, which
          is the part the reader does not already know.
        */}
        <View style={styles.heroPromptCopy}>
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
  );
});
