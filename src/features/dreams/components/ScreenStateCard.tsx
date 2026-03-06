import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';
import { createScreenStateCardStyles } from './ScreenStateCard.styles';

type ScreenStateCardProps = {
  variant: 'empty' | 'loading' | 'error';
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function ScreenStateCard({
  variant,
  title,
  subtitle,
  actionLabel,
  onAction,
}: ScreenStateCardProps) {
  const theme = useTheme<Theme>();
  const styles = createScreenStateCardStyles(theme);

  return (
    <Card style={styles.card}>
      <View
        style={[
          styles.pill,
          variant === 'loading' ? styles.pillLoading : null,
          variant === 'error' ? styles.pillError : null,
        ]}
      >
        <Text style={styles.pillText}>
          {variant === 'loading' ? '...' : variant === 'error' ? '!' : '+'}
        </Text>
      </View>

      <SectionHeader title={title} subtitle={subtitle} />

      {actionLabel && onAction ? (
        <Button
          title={actionLabel}
          onPress={onAction}
          variant={variant === 'error' ? 'danger' : 'ghost'}
        />
      ) : null}
    </Card>
  );
}
