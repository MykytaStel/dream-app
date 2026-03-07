import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createTagChipStyles } from './TagChip.styles';

export function TagChip({
  label,
  onPress,
  selected = false,
  removable = false,
}: {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  removable?: boolean;
}) {
  const t = useTheme<Theme>();
  const styles = createTagChipStyles(t, selected);
  const iconColor = selected ? t.colors.background : t.colors.textDim;
  const content = (
    <View style={styles.chip}>
      <Text style={styles.label}>{label}</Text>
      {removable ? (
        <View style={styles.icon}>
          <Ionicons name="close" size={12} color={iconColor} />
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable onPress={onPress} style={styles.pressable}>
      {content}
    </Pressable>
  );
}
