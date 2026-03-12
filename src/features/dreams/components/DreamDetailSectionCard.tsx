import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { Theme } from '../../../theme/theme';

type DreamDetailSectionCardProps = {
  title: string;
  meta?: string;
  expanded: boolean;
  onToggle: () => void;
  collapsible?: boolean;
  children: React.ReactNode;
};

const sectionLayoutTransition = LinearTransition.duration(160);

export function DreamDetailSectionCard({
  title,
  meta,
  expanded,
  onToggle,
  collapsible = true,
  children,
}: DreamDetailSectionCardProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={collapsible ? onToggle : undefined}
        style={({ pressed }) => [styles.header, pressed ? styles.headerPressed : null]}
        accessibilityRole={collapsible ? 'button' : undefined}
        accessibilityState={collapsible ? { expanded } : undefined}
      >
        <View style={styles.headerLead}>
          <View style={styles.titleWrap}>
            <Text style={styles.title}>{title}</Text>
            {meta ? <Text style={styles.metaInline}>{meta}</Text> : null}
          </View>
        </View>
        {collapsible ? (
          <View style={styles.headerAside}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textDim}
            />
          </View>
        ) : null}
      </Pressable>

      {expanded || !collapsible ? (
        <Animated.View
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
      paddingVertical: 12,
      paddingHorizontal: 13,
      gap: 10,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: 12,
    },
    headerPressed: {
      opacity: 0.96,
    },
    headerLead: {
      flex: 1,
      minWidth: 0,
    },
    titleWrap: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    headerAside: {
      minHeight: 30,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontWeight: '700',
      fontSize: 14,
      lineHeight: 20,
    },
    metaInline: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
    },
    content: {
      gap: 10,
      paddingTop: 4,
    },
  });
}
