import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createTagChipStyles } from './TagChip.styles';

export function TagChip({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const t = useTheme<Theme>();
  const styles = createTagChipStyles(t);
  const content = (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}
