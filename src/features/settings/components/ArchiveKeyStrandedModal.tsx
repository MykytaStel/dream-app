import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Text } from '../../../components/ui/Text';
import { Button } from '../../../components/ui/Button';
import { getArchiveRecoveryCode } from '../../../services/crypto/archiveKeyService';
import { reportError } from '../../../services/observability/errorReporting';
import type { Theme } from '../../../theme/theme';
import type { SettingsCopy } from '../../../constants/copy/settings';

type ArchiveKeyStrandedModalProps = {
  visible: boolean;
  copy: SettingsCopy;
  onDismiss: () => void;
};

/**
 * A one-time, unmissable version of the "attention" row `SettingsArchiveKeySection`
 * already renders quietly. Shown once, the first time the archive key turns out
 * unable to travel on its own; dismissing it — any way — marks it seen for good.
 */
export function ArchiveKeyStrandedModal({
  visible,
  copy,
  onDismiss,
}: ArchiveKeyStrandedModalProps) {
  const theme = useTheme<Theme>();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const [code, setCode] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!visible) {
      return;
    }

    let cancelled = false;

    getArchiveRecoveryCode()
      .then(value => {
        if (!cancelled) {
          setCode(value);
        }
      })
      .catch(error => {
        reportError(error, {
          event: 'archive_key_stranded_disclosure_code_failed',
        });
      });

    return () => {
      cancelled = true;
    };
  }, [visible]);

  if (!visible || !code) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop} accessibilityViewIsModal>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.archiveKeyStrandedDisclosureAction}
          style={StyleSheet.absoluteFill}
          onPress={onDismiss}
        />

        <View style={styles.sheet}>
          <Text style={styles.title}>
            {copy.archiveKeyStrandedDisclosureTitle}
          </Text>
          <Text style={styles.body}>{copy.archiveKeyStranded}</Text>

          <View style={styles.codeBlock}>
            <Text style={styles.codeIntro}>{copy.archiveKeyCodeIntro}</Text>
            <Text style={styles.code} selectable>
              {code}
            </Text>
          </View>

          <Button
            title={copy.archiveKeyStrandedDisclosureAction}
            onPress={onDismiss}
          />
        </View>
      </View>
    </Modal>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
      backgroundColor: `${theme.colors.ink}8F`,
    },
    sheet: {
      width: '100%',
      maxWidth: 440,
      gap: 14,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surfaceElevated,
    },
    title: {
      color: theme.colors.text,
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '700',
    },
    body: {
      color: theme.colors.textDim,
      fontSize: 14,
      lineHeight: 20,
    },
    codeBlock: {
      gap: 6,
      padding: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.background,
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
  });
}
