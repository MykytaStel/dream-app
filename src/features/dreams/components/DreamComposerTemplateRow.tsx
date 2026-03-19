import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { DreamComposerCopy } from './DreamComposer.types';
import { DREAM_TEMPLATE_DEFINITIONS, DreamTemplate } from '../model/dreamTemplates';

type TemplateWithLabel = DreamTemplate & { label: string };

function getTemplateLabel(id: string, copy: DreamComposerCopy): string {
  switch (id) {
    case 'lucid':
      return copy.templateLucidLabel;
    case 'nightmare':
      return copy.templateNightmareLabel;
    case 'vivid':
      return copy.templateVividLabel;
    case 'recurring':
      return copy.templateRecurringLabel;
    case 'fragment':
      return copy.templateFragmentLabel;
    case 'peaceful':
      return copy.templatePeacefulLabel;
    default:
      return id;
  }
}

type Props = {
  copy: DreamComposerCopy;
  onApplyTemplate: (template: DreamTemplate) => void;
};

export function DreamComposerTemplateRow({ copy, onApplyTemplate }: Props) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  const templates = React.useMemo<TemplateWithLabel[]>(
    () =>
      DREAM_TEMPLATE_DEFINITIONS.map(def => ({
        ...def,
        label: getTemplateLabel(def.id, copy),
      })),
    [copy],
  );

  return (
    <Card style={styles.card}>
      <Text style={styles.hint}>{copy.templateSectionHint}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {templates.map(template => (
          <Pressable
            key={template.id}
            style={({ pressed }) => [
              styles.chip,
              pressed ? styles.chipPressed : null,
            ]}
            onPress={() => onApplyTemplate(template)}
          >
            <View style={styles.chipIcon}>
              <Ionicons
                name={template.icon}
                size={13}
                color={theme.colors.textDim}
              />
            </View>
            <Text style={styles.chipLabel}>{template.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Card>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: 10,
      paddingVertical: 12,
    },
    hint: {
      color: theme.colors.textDim,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
    },
    scrollContent: {
      flexDirection: 'row',
      gap: 8,
      paddingRight: 4,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: theme.borderRadii.pill,
      paddingVertical: 7,
      paddingHorizontal: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceAlt,
    },
    chipPressed: {
      opacity: 0.75,
    },
    chipIcon: {
      marginTop: 1,
    },
    chipLabel: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '600',
    },
  });
}
