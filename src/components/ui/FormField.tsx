/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Theme } from '../../theme/theme';
import { Text } from './Text';

export function FormField({
  label,
  multiline,
  helperText,
  inputStyle,
  ...props
}: TextInputProps & {
  label?: string;
  helperText?: string;
  inputStyle?: TextInputProps['style'];
}) {
  const t = useTheme<Theme>();

  return (
    <View style={{ gap: 8 }}>
      {label ? <Text style={{ color: t.colors.textDim }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor="#777"
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          {
            borderWidth: 1,
            borderColor: t.colors.border,
            borderRadius: 12,
            padding: 12,
            color: t.colors.text,
            backgroundColor: t.colors.surfaceAlt,
          },
          inputStyle,
        ]}
        {...props}
      />
      {helperText ? <Text style={{ color: t.colors.textDim }}>{helperText}</Text> : null}
    </View>
  );
}
