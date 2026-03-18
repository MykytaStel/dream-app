/**
 * DreamShareCard — a fixed-size 375×580pt visual card for a single dream.
 *
 * Designed to be rendered off-screen and captured via react-native-view-shot
 * (not yet installed). Uses only RN StyleSheet — no Restyle dependency — so
 * it renders predictably without a ThemeProvider context.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../../../components/ui/Text';
import type { DreamCardData } from '../model/dreamCardPresentation';

// Static dark palette matching the app's aurora tokens
const PALETTE = {
  bg: '#141826',
  surface: '#1E2435',
  text: '#EEF0F8',
  textDim: '#8A8FA8',
  border: 'rgba(255,255,255,0.08)',
  tagBg: 'rgba(255,255,255,0.07)',
};

type Props = {
  card: DreamCardData;
  watermark: string;
};

export function DreamShareCard({ card, watermark }: Props) {
  const [gradientStart, gradientMid, gradientEnd] = card.gradient;

  return (
    <View style={styles.card}>
      {/* Gradient header strip */}
      <View style={styles.gradientStrip}>
        <View style={[styles.gradientSegment, { backgroundColor: gradientStart }]} />
        <View style={[styles.gradientSegment, { backgroundColor: gradientMid }]} />
        <View style={[styles.gradientSegment, { backgroundColor: gradientEnd }]} />
      </View>

      <View style={styles.body}>
        {/* Eyebrow */}
        <Text style={styles.eyebrow}>{watermark.toUpperCase()}</Text>

        {/* Title */}
        <Text style={styles.title} numberOfLines={3}>
          {card.title}
        </Text>

        {/* Date + mood row */}
        <View style={styles.metaRow}>
          <Text style={styles.date}>{card.dateLabel}</Text>
          {card.moodLabel ? (
            <View style={[styles.moodPill, { borderColor: gradientStart + '80' }]}>
              <View style={[styles.moodDot, { backgroundColor: gradientStart }]} />
              <Text style={styles.moodText}>{card.moodLabel}</Text>
            </View>
          ) : null}
        </View>

        {/* Excerpt */}
        {card.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={6}>
            {card.excerpt}
          </Text>
        ) : null}

        {/* Tags */}
        {card.tags.length > 0 ? (
          <View style={styles.tagsRow}>
            {card.tags.map(tag => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Footer watermark */}
        <View style={styles.footer}>
          <View style={[styles.footerAccent, { backgroundColor: gradientMid }]} />
          <Text style={styles.footerText}>{watermark}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 375,
    height: 580,
    backgroundColor: PALETTE.bg,
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientStrip: {
    height: 5,
    flexDirection: 'row',
  },
  gradientSegment: {
    flex: 1,
    opacity: 0.9,
  },
  body: {
    flex: 1,
    padding: 28,
    paddingTop: 24,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.8,
    color: PALETTE.textDim,
    marginBottom: 12,
    fontWeight: '600',
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '700',
    color: PALETTE.text,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  date: {
    fontSize: 13,
    color: PALETTE.textDim,
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  moodDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moodText: {
    fontSize: 12,
    color: PALETTE.text,
  },
  excerpt: {
    fontSize: 15,
    lineHeight: 24,
    color: PALETTE.textDim,
    marginBottom: 20,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: PALETTE.tagBg,
  },
  tagText: {
    fontSize: 12,
    color: PALETTE.textDim,
  },
  spacer: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  footerAccent: {
    width: 3,
    height: 14,
    borderRadius: 2,
    opacity: 0.7,
  },
  footerText: {
    fontSize: 12,
    color: PALETTE.textDim,
    letterSpacing: 0.4,
  },
});
