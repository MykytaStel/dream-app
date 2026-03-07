import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createControlPill } from '../../../theme/surfaces';

type SettingsValueChipProps = {
  value: string;
};

export function SettingsValueChip({ value }: SettingsValueChipProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.chip}>
      <Text style={styles.label} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    chip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingVertical: 6,
        paddingHorizontal: 10,
      }),
    },
    label: {
      color: theme.colors.text,
      fontWeight: '700',
      fontSize: 13,
    },
  });
}
