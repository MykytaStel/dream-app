import React from 'react';
import { Pressable, View } from 'react-native';
import { Text } from '../../../../components/ui/Text';
import { DreamComposerStyles } from '../DreamComposer.types';

/**
 * A one-to-five answer, drawn as one thing rather than five.
 *
 * Distress and recall were rendered as five independent option tiles in a
 * wrapping row. At a tile's minimum width five do not fit across a phone, so
 * the row broke four-and-one and the fifth stretched the full width — which
 * read as a different kind of answer rather than the top of a scale. The
 * ordering, which is the only thing a scale has, was the first casualty.
 *
 * Equal segments that never wrap fix that. The anchors underneath fix the
 * other half of the problem: five bare numbers never said which end was which,
 * and a label like "High distress" above them read as a yes-or-no question.
 */
type ComposerScaleFieldProps<T extends number> = {
  label: string;
  lowLabel: string;
  highLabel: string;
  options: Array<{ value: T; label: string }>;
  value?: T;
  onSelect: (value: T) => void;
  styles: DreamComposerStyles;
};

export function ComposerScaleField<T extends number>({
  label,
  lowLabel,
  highLabel,
  options,
  value,
  onSelect,
  styles,
}: ComposerScaleFieldProps<T>) {
  return (
    <View style={styles.contextBlock}>
      <Text style={styles.contextFieldLabel}>{label}</Text>
      <View style={styles.scaleRow}>
        {options.map(option => {
          const selected = value === option.value;

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected }}
              // Screen readers get the position that sighted users get from
              // the anchors below, which they cannot associate with a segment.
              accessibilityLabel={`${label}: ${option.label}`}
              key={option.value}
              style={[
                styles.scaleSegment,
                selected ? styles.scaleSegmentSelected : null,
              ]}
              onPress={() => onSelect(option.value)}
            >
              <Text
                style={[
                  styles.scaleSegmentLabel,
                  selected ? styles.scaleSegmentLabelSelected : null,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.scaleAnchorRow}>
        <Text style={styles.scaleAnchor}>{lowLabel}</Text>
        <Text style={styles.scaleAnchor}>{highLabel}</Text>
      </View>
    </View>
  );
}
