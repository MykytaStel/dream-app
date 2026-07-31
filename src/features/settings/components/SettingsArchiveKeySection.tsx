import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { FormField } from '../../../components/ui/FormField';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import type { Theme } from '../../../theme/theme';
import type { SettingsCopy } from '../../../constants/copy/settings';
import type { useArchiveKeyController } from '../hooks/useArchiveKeyController';

type ArchiveKeyController = ReturnType<typeof useArchiveKeyController>;

/**
 * The archive key, shown at whatever volume the situation earns.
 *
 * Most of the time this is one quiet line and a button nobody presses. The
 * layout deliberately does not grow a banner for the healthy case: a warning
 * everyone sees and almost nobody needs is how people learn to ignore warnings.
 */
export function SettingsArchiveKeySection({
  copy,
  controller,
}: {
  copy: SettingsCopy;
  controller: ArchiveKeyController;
}) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { presentation } = controller;

  if (controller.isCheckingKey) {
    return null;
  }

  return (
    <Card style={styles.card}>
      <SectionHeader
        title={copy.archiveKeyTitle}
        subtitle={copy.archiveKeyDescription}
      />

      <Text
        style={[
          styles.status,
          presentation.shouldWarn ? styles.statusWarning : null,
        ]}
        accessibilityRole="text"
      >
        {copy[presentation.statusCopyKey]}
      </Text>

      {presentation.canRevealRecoveryCode ? (
        <Button
          title={
            controller.recoveryCode
              ? copy.archiveKeyHideAction
              : copy.archiveKeyRevealAction
          }
          variant="ghost"
          size="sm"
          onPress={() => {
            controller.onToggleRecoveryCode().catch(() => undefined);
          }}
        />
      ) : null}

      {controller.recoveryCode ? (
        <View style={styles.codeBlock}>
          <Text style={styles.codeIntro}>{copy.archiveKeyCodeIntro}</Text>
          {/* Selectable so it can be copied into a password manager, which is
              a better home for it than a photo of a screen. */}
          <Text style={styles.code} selectable>
            {controller.recoveryCode}
          </Text>
        </View>
      ) : null}

      {presentation.showRecoveryCodeEntry ? (
        <View style={styles.entryBlock}>
          <FormField
            label={copy.archiveKeyEntryLabel}
            placeholder={copy.archiveKeyEntryPlaceholder}
            value={controller.enteredCode}
            onChangeText={controller.onChangeEnteredCode}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            invalid={controller.entryFeedback === 'invalid'}
            helperTone={
              controller.entryFeedback === 'invalid' ? 'error' : 'default'
            }
            helperText={
              controller.entryFeedback === 'invalid'
                ? copy.archiveKeyEntryInvalid
                : controller.entryFeedback === 'accepted'
                  ? copy.archiveKeyEntryAccepted
                  : undefined
            }
          />
          <Button
            title={copy.archiveKeyEntryAction}
            onPress={() => {
              controller.onSubmitRecoveryCode().catch(() => undefined);
            }}
            disabled={!controller.enteredCode.trim()}
          />
        </View>
      ) : null}
    </Card>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    card: {
      gap: theme.spacing.sm,
    },
    status: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    statusWarning: {
      color: theme.colors.text,
    },
    codeBlock: {
      gap: theme.spacing.xs,
    },
    codeIntro: {
      color: theme.colors.textDim,
      fontSize: 13,
      lineHeight: 19,
    },
    code: {
      color: theme.colors.text,
      fontSize: 15,
      lineHeight: 24,
      letterSpacing: 0.4,
    },
    entryBlock: {
      gap: theme.spacing.sm,
    },
  });
}
