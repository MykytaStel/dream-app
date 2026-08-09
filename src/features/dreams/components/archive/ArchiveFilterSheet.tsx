import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Text } from '../../../../components/ui/Text';
import type { Theme } from '../../../../theme/theme';
import type {
  ArchiveFilter,
  ArchiveTagSignal,
} from '../../model/archiveBrowser';
import type { ArchiveSpecialFilter } from '../../model/archiveSearch';
import {
  DEFAULT_ARCHIVE_FILTER_SELECTION,
  type ArchiveFilterSelection,
  type ArchiveFilterSheetCopy,
} from '../../model/archiveFilterSheet';

type ArchiveFilterSheetProps = {
  visible: boolean;
  copy: ArchiveFilterSheetCopy;
  archiveFilters: ReadonlyArray<{ key: ArchiveFilter; label: string }>;
  specialFilters: ReadonlyArray<{
    key: ArchiveSpecialFilter;
    label: string;
  }>;
  topTags: ArchiveTagSignal[];
  selection: ArchiveFilterSelection;
  onClose: () => void;
  onApply: (selection: ArchiveFilterSelection) => void;
};

export function ArchiveFilterSheet({
  visible,
  copy,
  archiveFilters,
  specialFilters,
  topTags,
  selection,
  onClose,
  onApply,
}: ArchiveFilterSheetProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [draft, setDraft] = React.useState<ArchiveFilterSelection>(selection);

  React.useEffect(() => {
    if (visible) {
      setDraft(selection);
    }
  }, [selection, visible]);

  const tagOptions = React.useMemo(() => {
    if (!selection.tagFilter) {
      return topTags;
    }

    const hasSelectedTag = topTags.some(
      signal => signal.tag === selection.tagFilter,
    );
    if (hasSelectedTag) {
      return topTags;
    }

    return [{ tag: selection.tagFilter, count: 0 }, ...topTags];
  }, [selection.tagFilter, topTags]);

  const applyDraft = React.useCallback(() => {
    onApply(draft);
    onClose();
  }, [draft, onApply, onClose]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.cancelLabel}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />

        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>{copy.title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.cancelLabel}
              hitSlop={10}
              style={styles.closeButton}
              onPress={onClose}
            >
              <Ionicons name="close" size={20} color={theme.colors.text} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            <FilterSection label={copy.statusLabel} styles={styles}>
              {archiveFilters.map(option => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  selected={draft.filter === option.key}
                  styles={styles}
                  onPress={() =>
                    setDraft(current => ({
                      ...current,
                      filter: option.key,
                    }))
                  }
                />
              ))}
            </FilterSection>

            <FilterSection label={copy.specialLabel} styles={styles}>
              {specialFilters.map(option => (
                <FilterChip
                  key={option.key}
                  label={option.label}
                  selected={draft.specialFilter === option.key}
                  styles={styles}
                  onPress={() =>
                    setDraft(current => ({
                      ...current,
                      specialFilter: option.key,
                    }))
                  }
                />
              ))}
            </FilterSection>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{copy.tagsLabel}</Text>
              <View style={styles.chipGrid}>
                <FilterChip
                  label={copy.allTagsLabel}
                  selected={!draft.tagFilter}
                  styles={styles}
                  onPress={() =>
                    setDraft(current => ({ ...current, tagFilter: null }))
                  }
                />
                {tagOptions.map(signal => (
                  <FilterChip
                    key={signal.tag}
                    label={
                      signal.count > 0
                        ? `${signal.tag} · ${signal.count}`
                        : signal.tag
                    }
                    selected={draft.tagFilter === signal.tag}
                    styles={styles}
                    onPress={() =>
                      setDraft(current => ({
                        ...current,
                        tagFilter:
                          current.tagFilter === signal.tag ? null : signal.tag,
                      }))
                    }
                  />
                ))}
              </View>
              {!tagOptions.length ? (
                <Text style={styles.emptyLabel}>{copy.noTagsLabel}</Text>
              ) : null}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              accessibilityRole="button"
              style={styles.secondaryButton}
              onPress={() => setDraft(DEFAULT_ARCHIVE_FILTER_SELECTION)}
            >
              <Text style={styles.secondaryButtonText}>{copy.resetLabel}</Text>
            </Pressable>
            <View style={styles.footerActions}>
              <Pressable
                accessibilityRole="button"
                style={styles.secondaryButton}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>
                  {copy.cancelLabel}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                style={styles.primaryButton}
                onPress={applyDraft}
              >
                <Text style={styles.primaryButtonText}>{copy.applyLabel}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

type FilterSectionProps = {
  label: string;
  styles: ReturnType<typeof createStyles>;
  children: React.ReactNode;
};

function FilterSection({ label, styles, children }: FilterSectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.chipGrid}>{children}</View>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  selected: boolean;
  styles: ReturnType<typeof createStyles>;
  onPress: () => void;
};

function FilterChip({ label, selected, styles, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected ? styles.chipSelected : null]}
      onPress={onPress}
    >
      <Text
        style={[styles.chipText, selected ? styles.chipTextSelected : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: `${theme.colors.scrim}8F`,
    },
    sheet: {
      maxHeight: '86%',
      gap: 14,
      paddingTop: 18,
      paddingHorizontal: 18,
      paddingBottom: 24,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderBottomWidth: 0,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    title: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '700',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
    },
    content: {
      gap: 20,
      paddingBottom: 4,
    },
    section: {
      gap: 10,
    },
    sectionLabel: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 15,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    chipGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    chip: {
      minHeight: 36,
      justifyContent: 'center',
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    chipSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    chipText: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
    },
    chipTextSelected: {
      color: theme.colors.onPrimary,
    },
    emptyLabel: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 17,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    footerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    secondaryButton: {
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 14,
      backgroundColor: theme.colors.background,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
    },
    primaryButton: {
      minHeight: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 20,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.primary,
    },
    primaryButtonText: {
      color: theme.colors.onPrimary,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
    },
  });
}
