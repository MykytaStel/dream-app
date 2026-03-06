import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';
import { createFormFieldStyles } from './FormField.styles';

export function FormField({
  label,
  multiline,
  helperText,
  helperTone = 'default',
  inputStyle,
  invalid = false,
  ...props
}: TextInputProps & {
  label?: string;
  helperText?: string;
  helperTone?: 'default' | 'error';
  inputStyle?: TextInputProps['style'];
  invalid?: boolean;
}) {
  const t = useTheme<Theme>();
  const styles = createFormFieldStyles(t);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#777"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[styles.input, invalid ? styles.inputInvalid : null, inputStyle]}
        {...props}
      />
      {helperText ? (
        <Text style={[styles.helper, helperTone === 'error' ? styles.helperError : null]}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}
