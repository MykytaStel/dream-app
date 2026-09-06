import React from 'react';
import {
  StyleProp,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createFormFieldStyles } from './FormField.styles';
import { useCalmMode } from '../../app/CalmModeProvider';

export function FormField({
  label,
  multiline,
  helperText,
  helperTone = 'default',
  inputStyle,
  containerStyle,
  invalid = false,
  ...props
}: TextInputProps & {
  label?: string;
  helperText?: string;
  helperTone?: 'default' | 'error';
  inputStyle?: TextInputProps['style'];
  containerStyle?: StyleProp<ViewStyle>;
  invalid?: boolean;
}) {
  const t = useTheme<Theme>();
  const styles = React.useMemo(() => createFormFieldStyles(t), [t]);
  const { calmMode } = useCalmMode();
  // An error is not prose — it is the reason the field is refusing input, and
  // it survives calm mode.
  const showHelper =
    Boolean(helperText) && (!calmMode || helperTone === 'error');

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={t.colors.textDim}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        // The visible label is a separate node, so a screen reader lands on the
        // input with nothing to say. Name it after the label, and when the field
        // is refusing input, read why. A caller's own a11y props still win —
        // they are spread last.
        accessibilityLabel={label}
        accessibilityHint={invalid && helperText ? helperText : undefined}
        style={[styles.input, invalid ? styles.inputInvalid : null, inputStyle]}
        {...props}
      />
      {showHelper ? (
        <Text
          style={[
            styles.helper,
            helperTone === 'error' ? styles.helperError : null,
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
