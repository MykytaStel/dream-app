import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createSoftTile } from '../../../theme/surfaces';
import { SettingsValueChip } from './SettingsValueChip';

type SettingsActionRowProps = {
  title: string;
  meta?: string;
  value?: string;
  disabled?: boolean;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

export function SettingsActionRow({
  title,
  meta,
  value,
  disabled = false,
  onPress,
  trailing,
}: SettingsActionRowProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const content = (
    <>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1} ellipsizeMode="middle">
            {meta}
          </Text>
        ) : null}
      </View>
      {trailing ?? (value ? <SettingsValueChip value={value} /> : null)}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && !disabled ? styles.rowPressed : null,
        disabled ? styles.rowDisabled : null,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    row: {
      ...createSoftTile(theme, {
        tone: 'surface',
        radius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
      }),
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    rowPressed: {
      opacity: 0.88,
    },
    rowDisabled: {
      opacity: 0.7,
    },
    copy: {
      flex: 1,
      gap: 2,
    },
    title: {
      fontWeight: '700',
    },
    meta: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
  });
}
