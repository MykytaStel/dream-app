/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';

export function TagChip({
  label,
  onPress,
}: {
  label: string;
  onPress?: () => void;
}) {
  const t = useTheme<Theme>();
  const content = (
    <View
      style={{
        borderRadius: 999,
        backgroundColor: t.colors.surfaceAlt,
        borderWidth: 1,
        borderColor: t.colors.border,
        paddingVertical: 6,
        paddingHorizontal: 10,
      }}
    >
      <Text style={{ fontWeight: '600' }}>{label}</Text>
    </View>
  );

  if (!onPress) {
    return content;
  }

  return <Pressable onPress={onPress}>{content}</Pressable>;
}
