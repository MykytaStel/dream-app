import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createControlPill, createSoftTile } from '../../../theme/surfaces';

type MonthlyReportEntryCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  monthTitle?: string | null;
  signals: string[];
  summary?: string | null;
  actionLabel: string;
  onPress: () => void;
};

function createMonthlyReportEntryCardStyles(theme: Theme) {
  return StyleSheet.create({
    root: {
      ...createSoftTile(theme, {
        tone: 'alt',
        radius: 16,
        paddingVertical: 12,
        paddingHorizontal: 12,
      }),
      gap: 10,
      borderColor: theme.colors.accent,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontWeight: '700',
    },
    copy: {
      gap: 3,
    },
    title: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
    },
    monthTitle: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: '600',
    },
    description: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    signalRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    signalChip: {
      ...createControlPill(theme, {
        tone: 'surface',
        paddingHorizontal: 10,
        paddingVertical: 6,
      }),
    },
    signalChipText: {
      color: theme.colors.text,
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    action: {
      alignSelf: 'flex-start',
    },
  });
}

export function MonthlyReportEntryCard(props: MonthlyReportEntryCardProps) {
  const {
    eyebrow,
    title,
    description,
    monthTitle,
    signals,
    summary,
    actionLabel,
    onPress,
  } = props;
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createMonthlyReportEntryCardStyles(theme), [theme]);

  return (
    <View style={styles.root}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        {monthTitle ? <Text style={styles.monthTitle}>{monthTitle}</Text> : null}
        <Text style={styles.description}>{description}</Text>
      </View>

      {signals.length ? (
        <View style={styles.signalRow}>
          {signals.map(signal => (
            <View key={signal} style={styles.signalChip}>
              <Text style={styles.signalChipText}>{signal}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {summary ? <Text style={styles.description}>{summary}</Text> : null}

      <Button
        title={actionLabel}
        variant="ghost"
        size="sm"
        icon="chevron-forward"
        iconPosition="right"
        style={styles.action}
        onPress={onPress}
      />
    </View>
  );
}
