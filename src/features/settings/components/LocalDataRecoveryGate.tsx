import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getStoredLocale } from '../../../i18n/localeStore';
import { reportActionError } from '../../../services/observability/errorReporting';
import { getStoredThemeId } from '../../../theme/themePreferences';
import { themes, type Theme } from '../../../theme/theme';
import {
  quarantineInterruptedLocalDataTransaction,
  recoverInterruptedLocalDataTransaction,
  type LocalDataRecoveryResult,
} from '../services/localDataTransactionJournalService';

type GateState =
  | { status: 'checking' }
  | { status: 'ready' }
  | {
      status: 'blocked';
      result: Extract<LocalDataRecoveryResult, { status: 'blocked' }>;
    };

const COPY = {
  en: {
    checkingTitle: 'Checking local archive recovery',
    checkingBody:
      'Kaleidoscope is checking whether an interrupted archive operation needs to be rolled back before data is opened.',
    blockedTitle: 'Archive recovery needs attention',
    invalidBody:
      'The interrupted-operation record is damaged, so the app cannot safely guess which local values to restore.',
    restoreBody:
      'The previous local state was found, but one of its platform side effects could not be restored safely.',
    checkpointBody:
      'A JSON recovery checkpoint was created before the interrupted operation.',
    retry: 'Retry recovery',
    continue: 'Continue without automatic rollback',
    continueHint:
      'Continuing preserves the raw recovery record in quarantine and prevents a stale rollback on a later launch. Inspect Archive health and your latest backup before editing data.',
  },
  uk: {
    checkingTitle: 'Перевіряю відновлення локального архіву',
    checkingBody:
      'Калейдоскоп перевіряє, чи потрібно відкотити перервану операцію з архівом до відкриття даних.',
    blockedTitle: 'Відновлення архіву потребує уваги',
    invalidBody:
      'Запис перерваної операції пошкоджений, тому застосунок не може безпечно вгадати, які локальні значення відновлювати.',
    restoreBody:
      'Попередній локальний стан знайдено, але один із системних side effects не вдалося безпечно відновити.',
    checkpointBody:
      'Перед перерваною операцією було створено JSON recovery checkpoint.',
    retry: 'Повторити відновлення',
    continue: 'Продовжити без автоматичного rollback',
    continueHint:
      'Продовження збереже raw recovery record у quarantine і не дозволить застарілому rollback спрацювати під час наступного запуску. Перевірте Archive health та останній backup перед редагуванням даних.',
  },
} as const;

export function LocalDataRecoveryGate({ children }: React.PropsWithChildren) {
  const [state, setState] = React.useState<GateState>({ status: 'checking' });
  const mountedRef = React.useRef(true);
  const locale = getStoredLocale();
  const copy = COPY[locale];
  const theme = themes[getStoredThemeId()];
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runRecovery = React.useCallback(async () => {
    setState({ status: 'checking' });
    try {
      const result = await recoverInterruptedLocalDataTransaction();
      if (!mountedRef.current) {
        return;
      }
      if (result.status === 'blocked') {
        setState({ status: 'blocked', result });
      } else {
        setState({ status: 'ready' });
      }
    } catch (error) {
      reportActionError('local_data_recovery_gate', error);
      if (mountedRef.current) {
        setState({
          status: 'blocked',
          result: {
            status: 'blocked',
            reason: 'restore-failed',
            transactionLabel: null,
            checkpointCreated: false,
          },
        });
      }
    }
  }, []);

  React.useEffect(() => {
    runRecovery().catch(() => undefined);
  }, [runRecovery]);

  const continueWithoutRollback = React.useCallback(() => {
    try {
      quarantineInterruptedLocalDataTransaction();
      setState({ status: 'ready' });
    } catch (error) {
      reportActionError('local_data_recovery_gate.quarantine', error);
    }
  }, []);

  if (state.status === 'ready') {
    return <>{children}</>;
  }

  if (state.status === 'checking') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.auroraMid} />
        <Text style={styles.title}>{copy.checkingTitle}</Text>
        <Text style={styles.body}>{copy.checkingBody}</Text>
      </View>
    );
  }

  const blockedBody =
    state.result.reason === 'journal-invalid'
      ? copy.invalidBody
      : copy.restoreBody;

  return (
    <View style={styles.container}>
      <View style={styles.warningIcon}>
        <Text style={styles.warningMark}>!</Text>
      </View>
      <Text style={styles.title}>{copy.blockedTitle}</Text>
      <Text style={styles.body}>{blockedBody}</Text>
      {state.result.checkpointCreated ? (
        <Text style={styles.checkpoint}>{copy.checkpointBody}</Text>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => runRecovery().catch(() => undefined)}
        >
          <Text style={styles.primaryLabel}>{copy.retry}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={continueWithoutRollback}
        >
          <Text style={styles.secondaryLabel}>{copy.continue}</Text>
        </Pressable>
      </View>
      <Text style={styles.hint}>{copy.continueHint}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.background,
      paddingHorizontal: 32,
      gap: 16,
    },
    warningIcon: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.destructiveSurface,
      borderWidth: 1,
      borderColor: theme.colors.destructiveBorder,
    },
    warningMark: {
      color: theme.colors.danger,
      fontSize: 28,
      fontWeight: '800',
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      lineHeight: 28,
      fontWeight: '700',
      textAlign: 'center',
    },
    body: {
      color: theme.colors.textDim,
      fontSize: 15,
      lineHeight: 22,
      textAlign: 'center',
      maxWidth: 560,
    },
    checkpoint: {
      color: theme.colors.primaryAlt,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
    },
    actions: {
      width: '100%',
      maxWidth: 440,
      gap: 10,
      marginTop: 8,
    },
    primaryButton: {
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.auroraMid,
      paddingHorizontal: 18,
    },
    primaryLabel: {
      color: theme.colors.onPrimary,
      fontSize: 15,
      fontWeight: '700',
      textAlign: 'center',
    },
    secondaryButton: {
      minHeight: 48,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 18,
    },
    secondaryLabel: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.72,
    },
    hint: {
      color: theme.colors.textDim,
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'center',
      maxWidth: 560,
    },
  });
}
