import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Button } from '../../../../components/ui/Button';
import { SectionHeader } from '../../../../components/ui/SectionHeader';
import { SegmentedControl } from '../../../../components/ui/SegmentedControl';
import { Text } from '../../../../components/ui/Text';
import { type DreamCopy } from '../../../../constants/copy/dreams';
import { Theme } from '../../../../theme/theme';
import {
  HOME_LAYOUT_SECTIONS,
  type HomeLayoutPreferences,
  type HomeLayoutPreset,
  type HomeLayoutSection,
} from '../../model/homeLayout';
import { createHomeScreenStyles } from '../../screens/HomeScreen.styles';

type HomeCustomizationSheetProps = {
  visible: boolean;
  copy: DreamCopy;
  styles: ReturnType<typeof createHomeScreenStyles>;
  preferences: HomeLayoutPreferences;
  onClose: () => void;
  onApplyPreset: (preset: HomeLayoutPreset) => void;
  onToggleSectionVisibility: (section: HomeLayoutSection) => void;
  onReorderSection: (
    section: HomeLayoutSection,
    direction: 'up' | 'down',
  ) => void;
  onReset: () => void;
};

const PRESET_VALUES: HomeLayoutPreset[] = ['calm', 'balanced', 'insight'];

export function HomeCustomizationSheet({
  visible,
  copy,
  styles,
  preferences,
  onClose,
  onApplyPreset,
  onToggleSectionVisibility,
  onReorderSection,
  onReset,
}: HomeCustomizationSheetProps) {
  const theme = useTheme<Theme>();
  const presetOptions = React.useMemo(
    () =>
      PRESET_VALUES.map(value => ({
        value,
        label: getPresetLabel(value, copy),
      })),
    [copy],
  );

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.filterSheetRoot}>
        <Pressable style={styles.filterSheetBackdrop} onPress={onClose} />
        <View style={styles.filterSheetCard}>
          <View style={styles.filterSheetHeader}>
            <View style={styles.filterSheetHandle} />
            <SectionHeader
              title={copy.homeCustomizeTitle}
              subtitle={copy.homeCustomizePresetHint}
            />
            <View style={styles.filterSheetHeaderActions}>
              <Button
                title={copy.homeCustomizeReset}
                variant="ghost"
                size="sm"
                onPress={onReset}
              />
              <Button
                title={copy.homeCustomizeDone}
                variant="ghost"
                size="sm"
                onPress={onClose}
              />
            </View>
          </View>

          <ScrollView
            style={styles.filterSheetScroll}
            contentContainerStyle={styles.filterSheetBody}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.controlSection}>
              <Text style={styles.filterGroupLabel}>
                {copy.homeCustomizePresetLabel}
              </Text>
              <SegmentedControl
                options={presetOptions}
                selectedValue={preferences.preset}
                onChange={(value: HomeLayoutPreset) => onApplyPreset(value)}
                columns={3}
                minWidth={96}
              />
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>
                {copy.homeCustomizeSectionsLabel}
              </Text>
              <Text style={styles.filterGroupMetaLabel}>
                {copy.homeCustomizeSectionsHint}
              </Text>
              <View style={styles.filterRow}>
                {HOME_LAYOUT_SECTIONS.map(section => {
                  const isVisible = !preferences.hiddenSections.includes(section);

                  return (
                    <Pressable
                      key={section}
                      style={[
                        styles.filterButton,
                        isVisible ? styles.filterButtonActive : null,
                      ]}
                      onPress={() => onToggleSectionVisibility(section)}
                    >
                      <Text
                        style={[
                          styles.filterButtonLabel,
                          isVisible ? styles.filterButtonLabelActive : null,
                        ]}
                      >
                        {getSectionLabel(section, copy)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupLabel}>
                {copy.homeCustomizeOrderLabel}
              </Text>
              <Text style={styles.filterGroupMetaLabel}>
                {copy.homeCustomizeOrderHint}
              </Text>
              <View style={styles.homeCustomizeOrderList}>
                {preferences.sectionOrder.map((section, index) => {
                  const isHidden = preferences.hiddenSections.includes(section);

                  return (
                    <View
                      key={section}
                      style={[
                        styles.homeCustomizeOrderRow,
                        isHidden ? styles.homeCustomizeOrderRowHidden : null,
                      ]}
                    >
                      <View style={styles.homeCustomizeOrderCopy}>
                        <Text style={styles.homeCustomizeOrderTitle}>
                          {getSectionLabel(section, copy)}
                        </Text>
                        <Text style={styles.homeCustomizeOrderMeta}>
                          {isHidden
                            ? copy.homeCustomizeHiddenLabel
                            : copy.homeCustomizeVisibleLabel}
                        </Text>
                      </View>

                      <View style={styles.homeCustomizeOrderActions}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={index === 0}
                          style={({ pressed }) => [
                            styles.homeCustomizeOrderButton,
                            index === 0
                              ? styles.homeCustomizeOrderButtonDisabled
                              : null,
                            pressed
                              ? styles.homeCustomizeOrderButtonPressed
                              : null,
                          ]}
                          onPress={() => onReorderSection(section, 'up')}
                        >
                          <Ionicons
                            name="chevron-up-outline"
                            size={16}
                            color={
                              index === 0
                                ? theme.colors.textDim
                                : theme.colors.text
                            }
                          />
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          disabled={index === preferences.sectionOrder.length - 1}
                          style={({ pressed }) => [
                            styles.homeCustomizeOrderButton,
                            index === preferences.sectionOrder.length - 1
                              ? styles.homeCustomizeOrderButtonDisabled
                              : null,
                            pressed
                              ? styles.homeCustomizeOrderButtonPressed
                              : null,
                          ]}
                          onPress={() => onReorderSection(section, 'down')}
                        >
                          <Ionicons
                            name="chevron-down-outline"
                            size={16}
                            color={
                              index === preferences.sectionOrder.length - 1
                                ? theme.colors.textDim
                                : theme.colors.text
                            }
                          />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function getPresetLabel(preset: HomeLayoutPreset, copy: DreamCopy) {
  switch (preset) {
    case 'calm':
      return copy.homeCustomizePresetCalm;
    case 'insight':
      return copy.homeCustomizePresetInsight;
    case 'balanced':
    default:
      return copy.homeCustomizePresetBalanced;
  }
}

function getSectionLabel(section: HomeLayoutSection, copy: DreamCopy) {
  switch (section) {
    case 'spotlight':
      return copy.homeCustomizeSectionSpotlight;
    case 'weeklyPatterns':
      return copy.homeCustomizeSectionWeeklyPatterns;
    case 'shortcuts':
    default:
      return copy.homeCustomizeSectionShortcuts;
  }
}
