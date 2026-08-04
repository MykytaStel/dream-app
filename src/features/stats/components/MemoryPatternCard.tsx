import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import type { Theme } from '../../../theme/theme';
import type {
  MemoryPatternCandidate,
  MemoryPatternCopy,
} from '../model/memoryPattern';

function PatternAction({
  label,
  icon,
  active = false,
  disabled = false,
  onPress,
}: {
  label: string;
  icon: string;
  active?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, selected: active }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        active ? styles.actionActive : null,
        disabled ? styles.actionDisabled : null,
        pressed && !disabled ? styles.actionPressed : null,
      ]}
    >
      <Ionicons
        name={icon}
        size={14}
        color={active ? theme.colors.background : theme.colors.text}
      />
      <Text
        style={[styles.actionText, active ? styles.actionTextActive : null]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function MemoryPatternCard({
  candidate,
  copy,
  onConfirm,
  onDismiss,
  onRename,
  onOpenDream,
  onOpenPattern,
}: {
  candidate: MemoryPatternCandidate;
  copy: MemoryPatternCopy;
  onConfirm: () => void;
  onDismiss: () => void;
  onRename: (title: string) => void;
  onOpenDream: (dreamId: string) => void;
  onOpenPattern: () => void;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [isRenameOpen, setIsRenameOpen] = React.useState(false);
  const [renameDraft, setRenameDraft] = React.useState(candidate.displayTitle);

  React.useEffect(() => {
    setRenameDraft(candidate.displayTitle);
    setIsRenameOpen(false);
  }, [candidate.key, candidate.displayTitle]);

  const closeRename = React.useCallback(() => {
    setRenameDraft(candidate.displayTitle);
    setIsRenameOpen(false);
  }, [candidate.displayTitle]);

  const saveRename = React.useCallback(() => {
    const title = renameDraft.trim();
    if (!title) {
      return;
    }

    onRename(title);
    setIsRenameOpen(false);
  }, [onRename, renameDraft]);

  return (
    <>
      <Card style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>
              {candidate.confirmed ? copy.confirmedEyebrow : copy.eyebrow}
            </Text>
            <Text style={styles.title}>{candidate.displayTitle}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              candidate.confirmed ? styles.statusPillConfirmed : null,
            ]}
          >
            <Ionicons
              name={
                candidate.confirmed ? 'checkmark-circle' : 'sparkles-outline'
              }
              size={13}
              color={theme.colors.accent}
            />
            <Text style={styles.statusText}>
              {copy.countLabel(candidate.dreamCount)}
            </Text>
          </View>
        </View>

        <Text style={styles.hypothesis}>{copy.hypothesis}</Text>

        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>{copy.evidenceTitle}</Text>
          <View style={styles.evidenceList}>
            {candidate.evidence.map((evidence, index) => (
              <Pressable
                accessibilityRole="button"
                key={evidence.dreamId}
                onPress={() => onOpenDream(evidence.dreamId)}
                style={({ pressed }) => [
                  styles.evidenceRow,
                  pressed ? styles.evidenceRowPressed : null,
                ]}
              >
                <View style={styles.evidenceIndex}>
                  <Text style={styles.evidenceIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.evidenceCopy}>
                  <View style={styles.evidenceHeader}>
                    <Text style={styles.evidenceDreamTitle} numberOfLines={1}>
                      {evidence.title || copy.fallbackDreamTitle}
                    </Text>
                    <Text style={styles.evidenceDate}>
                      {evidence.dateLabel}
                    </Text>
                  </View>
                  {evidence.preview ? (
                    <Text style={styles.evidencePreview} numberOfLines={2}>
                      {evidence.preview}
                    </Text>
                  ) : null}
                  <Text style={styles.evidenceSources}>
                    {evidence.sources
                      .map(source => copy.sourceLabels[source])
                      .join(' · ')}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={15}
                  color={theme.colors.textDim}
                />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.actionsRow}>
          <PatternAction
            label={
              candidate.confirmed ? copy.confirmedAction : copy.confirmAction
            }
            icon={
              candidate.confirmed ? 'checkmark-circle' : 'checkmark-outline'
            }
            active={candidate.confirmed}
            disabled={candidate.confirmed}
            onPress={onConfirm}
          />
          <PatternAction
            label={copy.dismissAction}
            icon="close-outline"
            onPress={onDismiss}
          />
          <PatternAction
            label={copy.renameAction}
            icon="pencil-outline"
            onPress={() => setIsRenameOpen(true)}
          />
          <PatternAction
            label={copy.openAllAction}
            icon="albums-outline"
            onPress={onOpenPattern}
          />
        </View>
      </Card>

      <Modal
        visible={isRenameOpen}
        transparent
        animationType="fade"
        onRequestClose={closeRename}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.backdrop} onPress={closeRename} />
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderCopy}>
                <Text style={styles.modalTitle}>{copy.renameTitle}</Text>
                <Text style={styles.modalDescription}>
                  {copy.renameDescription}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={closeRename}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={18} color={theme.colors.text} />
              </Pressable>
            </View>

            <TextInput
              autoFocus
              value={renameDraft}
              onChangeText={setRenameDraft}
              placeholder={copy.renamePlaceholder}
              placeholderTextColor={theme.colors.textDim}
              selectionColor={theme.colors.primary}
              style={styles.input}
              maxLength={80}
              returnKeyType="done"
              onSubmitEditing={saveRename}
            />

            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closeRename}
                style={styles.modalSecondaryAction}
              >
                <Text style={styles.modalSecondaryText}>
                  {copy.cancelAction}
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!renameDraft.trim()}
                onPress={saveRename}
                style={[
                  styles.modalPrimaryAction,
                  !renameDraft.trim() ? styles.actionDisabled : null,
                ]}
              >
                <Text style={styles.modalPrimaryText}>{copy.saveAction}</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: 14,
      padding: 15,
      borderColor: `${theme.colors.accent}66`,
      backgroundColor: theme.colors.surfaceElevated,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      flexWrap: 'wrap',
    },
    headerCopy: {
      flex: 1,
      minWidth: 180,
      gap: 4,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    title: {
      color: theme.colors.text,
      fontSize: 21,
      lineHeight: 27,
      fontWeight: '800',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: `${theme.colors.accent}55`,
      backgroundColor: theme.colors.background,
      paddingVertical: 5,
      paddingHorizontal: 8,
    },
    statusPillConfirmed: {
      borderColor: theme.colors.accent,
    },
    statusText: {
      color: theme.colors.textDim,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
    },
    hypothesis: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    evidenceSection: {
      gap: 8,
    },
    evidenceTitle: {
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '800',
    },
    evidenceList: {
      gap: 7,
    },
    evidenceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 9,
      paddingHorizontal: 10,
    },
    evidenceRowPressed: {
      opacity: 0.94,
    },
    evidenceIndex: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    evidenceIndexText: {
      color: theme.colors.accent,
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '800',
    },
    evidenceCopy: {
      flex: 1,
      minWidth: 0,
      gap: 3,
    },
    evidenceHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    evidenceDreamTitle: {
      flex: 1,
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '700',
    },
    evidenceDate: {
      color: theme.colors.textDim,
      fontSize: 9,
      lineHeight: 13,
      fontWeight: '600',
    },
    evidencePreview: {
      color: theme.colors.textDim,
      fontSize: 11,
      lineHeight: 16,
    },
    evidenceSources: {
      color: theme.colors.accent,
      fontSize: 9,
      lineHeight: 13,
      fontWeight: '700',
      textTransform: 'capitalize',
    },
    actionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 7,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 7,
      paddingHorizontal: 10,
    },
    actionActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
    },
    actionDisabled: {
      opacity: 0.55,
    },
    actionPressed: {
      opacity: 0.9,
    },
    actionText: {
      color: theme.colors.text,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '700',
    },
    actionTextActive: {
      color: theme.colors.background,
    },
    modalRoot: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFill,
      backgroundColor: `${theme.colors.ink}8F`,
    },
    modalCard: {
      gap: 16,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
      padding: 18,
      paddingBottom: 28,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
    },
    modalHeaderCopy: {
      flex: 1,
      gap: 5,
    },
    modalTitle: {
      color: theme.colors.text,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '800',
    },
    modalDescription: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    input: {
      minHeight: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontSize: 15,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 9,
    },
    modalSecondaryAction: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    modalSecondaryText: {
      color: theme.colors.text,
      fontSize: 12,
      fontWeight: '700',
    },
    modalPrimaryAction: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary,
      paddingVertical: 9,
      paddingHorizontal: 14,
    },
    modalPrimaryText: {
      color: theme.colors.background,
      fontSize: 12,
      fontWeight: '800',
    },
  });
}
