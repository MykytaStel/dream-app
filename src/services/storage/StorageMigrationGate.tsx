import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { getStoredLocale } from '../../i18n/localeStore';
import { reportActionError } from '../observability/errorReporting';
import { getStoredThemeId } from '../../theme/themePreferences';
import { themes, type Theme } from '../../theme/theme';
import { CURRENT_STORAGE_SCHEMA_VERSION } from './keys';
import {
  runStorageMigrationsTransactionally,
  type StorageMigrationResult,
} from './storageMigrationService';

type GateState =
  | { status: 'checking' }
  | { status: 'ready' }
  | {
      status: 'blocked';
      result: Extract<StorageMigrationResult, { status: 'blocked' }>;
    }
  | {
      status: 'failed';
      result: Extract<StorageMigrationResult, { status: 'failed' }>;
    };

const COPY = {
  en: {
    checkingTitle: 'Preparing local archive',
    checkingBody:
      'Kaleidoscope is safely updating the local storage format before dreams are opened.',
    blockedTitle: 'Storage update needs attention',
    invalidSchema:
      'The local storage version marker is damaged. The app will not guess a version or overwrite archive data.',
    newerSchema:
      'This archive was written by a newer Kaleidoscope version. Update the app before opening or editing it.',
    unreadableArchive:
      'The stored dream collection cannot be read. Migration was not started, and the original local value remains unchanged.',
    failedTitle: 'Storage update did not complete',
    failedRolledBack:
      'The previous local state was restored. You can retry the migration safely.',
    failedNeedsRestart:
      'Rollback could not be confirmed. Restart the app so interrupted-transaction recovery runs before another migration attempt.',
    retry: 'Retry storage update',
    restartHint:
      'Do not clear app data or reinstall before checking your latest JSON backup.',
    version: 'Storage version',
  },
  uk: {
    checkingTitle: 'Готую локальний архів',
    checkingBody:
      'Калейдоскоп безпечно оновлює формат локального сховища до відкриття снів.',
    blockedTitle: 'Оновлення сховища потребує уваги',
    invalidSchema:
      'Маркер версії локального сховища пошкоджений. Застосунок не буде вгадувати версію або перезаписувати архів.',
    newerSchema:
      'Цей архів створено новішою версією Калейдоскопа. Оновіть застосунок перед відкриттям або редагуванням.',
    unreadableArchive:
      'Збережену колекцію снів неможливо прочитати. Migration не запускалася, а початкове локальне значення залишилося без змін.',
    failedTitle: 'Оновлення сховища не завершено',
    failedRolledBack:
      'Попередній локальний стан відновлено. Migration можна безпечно повторити.',
    failedNeedsRestart:
      'Rollback не вдалося підтвердити. Перезапустіть застосунок, щоб recovery перерваної transaction виконалося до нової спроби migration.',
    retry: 'Повторити оновлення сховища',
    restartHint:
      'Не очищайте дані застосунку й не перевстановлюйте його до перевірки останнього JSON backup.',
    version: 'Версія сховища',
  },
} as const;

export function StorageMigrationGate({ children }: React.PropsWithChildren) {
  const [state, setState] = React.useState<GateState>({ status: 'checking' });
  const mountedRef = React.useRef(true);
  const copy = COPY[getStoredLocale()];
  const theme = themes[getStoredThemeId()];
  const styles = React.useMemo(() => createStyles(theme), [theme]);

  React.useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const runMigration = React.useCallback(async () => {
    setState({ status: 'checking' });
    try {
      const result = await runStorageMigrationsTransactionally();
      if (!mountedRef.current) {
        return;
      }

      if (result.status === 'current' || result.status === 'completed') {
        setState({ status: 'ready' });
      } else if (result.status === 'blocked') {
        setState({ status: 'blocked', result });
      } else {
        setState({ status: 'failed', result });
      }
    } catch (error) {
      reportActionError('storage_migration_gate', error);
      if (mountedRef.current) {
        setState({
          status: 'failed',
          result: {
            status: 'failed',
            reason: 'transaction-failed',
            fromVersion: 1,
            toVersion: CURRENT_STORAGE_SCHEMA_VERSION,
            rollbackCompleted: null,
          },
        });
      }
    }
  }, []);

  React.useEffect(() => {
    runMigration().catch(() => undefined);
  }, [runMigration]);

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

  const result = state.result;
  const versionLabel = `${copy.version}: ${
    result.fromVersion ?? '—'
  } → ${result.toVersion}`;

  let body: string;
  if (result.status === 'blocked') {
    body =
      result.reason === 'invalid-schema-marker'
        ? copy.invalidSchema
        : result.reason === 'newer-schema'
          ? copy.newerSchema
          : copy.unreadableArchive;
  } else {
    body =
      result.rollbackCompleted === true
        ? copy.failedRolledBack
        : copy.failedNeedsRestart;
  }

  const canRetry =
    result.status === 'blocked'
      ? result.reason === 'dream-store-unreadable'
      : result.rollbackCompleted === true;

  return (
    <View style={styles.container}>
      <View style={styles.warningIcon}>
        <Text style={styles.warningMark}>!</Text>
      </View>
      <Text style={styles.title}>
        {state.status === 'blocked' ? copy.blockedTitle : copy.failedTitle}
      </Text>
      <Text style={styles.body}>{body}</Text>
      <Text style={styles.version}>{versionLabel}</Text>
      {canRetry ? (
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.primaryButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => runMigration().catch(() => undefined)}
        >
          <Text style={styles.primaryLabel}>{copy.retry}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.hint}>{copy.restartHint}</Text>
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
      backgroundColor: `${theme.colors.danger}26`,
      borderWidth: 1,
      borderColor: `${theme.colors.danger}88`,
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
    version: {
      color: theme.colors.primaryAlt,
      fontSize: 13,
      lineHeight: 18,
      textAlign: 'center',
    },
    primaryButton: {
      minHeight: 48,
      width: '100%',
      maxWidth: 440,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.auroraMid,
      paddingHorizontal: 18,
      marginTop: 4,
    },
    primaryLabel: {
      color: theme.colors.onPrimary,
      fontSize: 15,
      fontWeight: '700',
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
