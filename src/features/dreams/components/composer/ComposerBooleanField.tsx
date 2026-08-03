import React from 'react';
import { Switch, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../../components/ui/Text';
import { Theme } from '../../../../theme/theme';
import { DreamComposerStyles } from '../DreamComposer.types';

/**
 * A yes-or-no answer, on one line.
 *
 * These were two full-width tiles each, and the nightmare card asked three of
 * them — six large rectangles, stacked, for three bits of information. A
 * switch is the control the rest of the app already uses for exactly this
 * question, and it leaves the answer readable at a glance instead of
 * requiring the reader to work out which of two tiles is filled.
 *
 * Off and unanswered look the same, which is honest here: nothing is stored
 * until the switch is touched, so an untouched card still records no opinion
 * rather than a "no".
 */
type ComposerBooleanFieldProps = {
  label: string;
  hint?: string;
  value?: boolean;
  onChange: (value: boolean) => void;
  styles: DreamComposerStyles;
};

export function ComposerBooleanField({
  label,
  hint,
  value,
  onChange,
  styles,
}: ComposerBooleanFieldProps) {
  const t = useTheme<Theme>();

  return (
    <View style={styles.booleanRow}>
      <View style={styles.booleanCopy}>
        <Text style={styles.contextFieldLabel}>{label}</Text>
        {hint ? <Text style={styles.booleanHint}>{hint}</Text> : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value === true}
        onValueChange={onChange}
        trackColor={{ false: t.colors.switchTrackOff, true: t.colors.primary }}
        thumbColor={t.colors.switchThumb}
      />
    </View>
  );
}
