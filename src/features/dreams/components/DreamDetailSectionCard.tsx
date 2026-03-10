import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { createControlPill } from '../../../theme/surfaces';
import { Theme } from '../../../theme/theme';

type DreamDetailSectionCardProps = {
  title: string;
  meta?: string;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const sectionLayoutTransition = LinearTransition.springify()
  .damping(18)
  .stiffness(180);

export function DreamDetailSectionCard({
  title,
  meta,
  expanded,
  onToggle,
  children,
}: DreamDetailSectionCardProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [styles.header, pressed ? styles.headerPressed : null]}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.headerAside}>
          {meta ? (
            <View style={styles.metaChip}>
              <Text style={styles.metaLabel}>{meta}</Text>
            </View>
          ) : null}
          <View style={styles.toggleChip}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.colors.textDim}
            />
          </View>
        </View>
      </Pressable>

      {expanded ? (
        <Animated.View
          entering={FadeInDown.duration(180)}
          exiting={FadeOutUp.duration(150)}
          layout={sectionLayoutTransition}
          style={styles.content}
        >
          {children}
        </Animated.View>
      ) : null}
    </Card>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      padding: 12,
      gap: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    headerPressed: {
      opacity: 0.96,
    },
    headerAside: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    title: {
      flex: 1,
      fontWeight: '700',
      fontSize: 14,
      lineHeight: 19,
    },
    metaChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 8,
      }),
    },
    metaLabel: {
      color: theme.colors.textDim,
      fontSize: 9,
      fontWeight: '700',
    },
    toggleChip: {
      ...createControlPill(theme, {
        tone: 'background',
        paddingVertical: 4,
        paddingHorizontal: 4,
      }),
      width: 26,
      height: 26,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      gap: 10,
    },
  });
}
