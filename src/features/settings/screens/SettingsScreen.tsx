import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import {
  applyDreamReminderSettings,
  getDreamReminderSettings,
  REMINDER_TIME_OPTIONS,
  requestReminderPermission,
  type DreamReminderSettings,
} from '../../reminders/services/dreamReminderService';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { AppLocale } from '../../../i18n/types';
import { useI18n } from '../../../i18n/I18nProvider';

export default function SettingsScreen() {
  const t = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = createSettingsScreenStyles(t);
  const [reminderSettings, setReminderSettings] = React.useState<DreamReminderSettings>(() =>
    getDreamReminderSettings(),
  );

  async function updateReminderSettings(next: DreamReminderSettings) {
    try {
      setReminderSettings(next);
      await applyDreamReminderSettings(next);
    } catch (error) {
      Alert.alert(copy.reminderSaveErrorTitle, String(error));
    }
  }

  async function onToggleReminder() {
    if (!reminderSettings.enabled) {
      const allowed = await requestReminderPermission();
      if (!allowed) {
        Alert.alert(
          copy.reminderPermissionDeniedTitle,
          copy.reminderPermissionDeniedDescription,
        );
        return;
      }
    }

    await updateReminderSettings({
      ...reminderSettings,
      enabled: !reminderSettings.enabled,
    });
  }

  async function onSelectTime(hour: number, minute: number) {
    await updateReminderSettings({
      ...reminderSettings,
      hour,
      minute,
    });
  }

  async function onSelectLocale(nextLocale: AppLocale) {
    setLocale(nextLocale);

    try {
      await applyDreamReminderSettings(reminderSettings);
    } catch (error) {
      Alert.alert(copy.reminderSaveErrorTitle, String(error));
    }
  }

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{copy.title}</Text>
        <SectionHeader title={copy.title} subtitle={copy.subtitle} large />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.versionTitle}</Text>
        <Text style={styles.description}>{copy.versionValue}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.reminderTitle}</Text>
        <Text style={styles.description}>{copy.reminderDescription}</Text>

        <View style={styles.reminderRow}>
          <Text style={styles.reminderLabel}>{copy.reminderStatusLabel}</Text>
          <Text style={styles.reminderValue}>
            {reminderSettings.enabled
              ? copy.reminderEnabled
              : copy.reminderDisabled}
          </Text>
        </View>

        <Text style={styles.reminderLabel}>{copy.reminderTimeLabel}</Text>
        <View style={styles.reminderTimeRow}>
          {REMINDER_TIME_OPTIONS.map(option => {
            const active =
              reminderSettings.hour === option.hour &&
              reminderSettings.minute === option.minute;
            return (
              <Pressable
                key={option.label}
                style={[
                  styles.reminderTimeChip,
                  active ? styles.reminderTimeChipActive : null,
                ]}
                onPress={() => onSelectTime(option.hour, option.minute)}
              >
                <Text
                  style={[
                    styles.reminderTimeChipText,
                    active ? styles.reminderTimeChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Button
          title={
            reminderSettings.enabled
              ? copy.reminderDisableButton
              : copy.reminderEnableButton
          }
          variant={reminderSettings.enabled ? 'ghost' : 'primary'}
          onPress={onToggleReminder}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.languageTitle}</Text>
        <Text style={styles.description}>{copy.languageDescription}</Text>
        <View style={styles.reminderTimeRow}>
          {([
            { value: 'en', label: copy.languageEnglish },
            { value: 'uk', label: copy.languageUkrainian },
          ] as Array<{ value: AppLocale; label: string }>).map(option => {
            const selected = locale === option.value;

            return (
              <Pressable
                key={option.value}
                style={[
                  styles.reminderTimeChip,
                  selected ? styles.reminderTimeChipActive : null,
                ]}
                onPress={() => onSelectLocale(option.value)}
              >
                <Text
                  style={[
                    styles.reminderTimeChipText,
                    selected ? styles.reminderTimeChipTextActive : null,
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.architectureTitle}</Text>
        <Text style={styles.description}>{copy.architectureDescription}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{copy.plannedTitle}</Text>
        <Text style={styles.description}>
          {copy.plannedDescription}
        </Text>
      </Card>
    </ScreenContainer>
  );
}
