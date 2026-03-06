import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { SectionHeader } from '../../../components/ui/SectionHeader';
import { Text } from '../../../components/ui/Text';
import { SETTINGS_COPY } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import {
  applyDreamReminderSettings,
  getDreamReminderSettings,
  REMINDER_TIME_OPTIONS,
  requestReminderPermission,
  type DreamReminderSettings,
} from '../../reminders/services/dreamReminderService';
import { createSettingsScreenStyles } from './SettingsScreen.styles';

export default function SettingsScreen() {
  const t = useTheme<Theme>();
  const styles = createSettingsScreenStyles(t);
  const [reminderSettings, setReminderSettings] = React.useState<DreamReminderSettings>(() =>
    getDreamReminderSettings(),
  );

  async function updateReminderSettings(next: DreamReminderSettings) {
    try {
      setReminderSettings(next);
      await applyDreamReminderSettings(next);
    } catch (error) {
      Alert.alert(SETTINGS_COPY.reminderSaveErrorTitle, String(error));
    }
  }

  async function onToggleReminder() {
    if (!reminderSettings.enabled) {
      const allowed = await requestReminderPermission();
      if (!allowed) {
        Alert.alert(
          SETTINGS_COPY.reminderPermissionDeniedTitle,
          SETTINGS_COPY.reminderPermissionDeniedDescription,
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

  return (
    <ScreenContainer scroll>
      <Card style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>{SETTINGS_COPY.title}</Text>
        <SectionHeader title={SETTINGS_COPY.title} subtitle={SETTINGS_COPY.subtitle} large />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{SETTINGS_COPY.versionTitle}</Text>
        <Text style={styles.description}>{SETTINGS_COPY.versionValue}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{SETTINGS_COPY.reminderTitle}</Text>
        <Text style={styles.description}>{SETTINGS_COPY.reminderDescription}</Text>

        <View style={styles.reminderRow}>
          <Text style={styles.reminderLabel}>{SETTINGS_COPY.reminderStatusLabel}</Text>
          <Text style={styles.reminderValue}>
            {reminderSettings.enabled
              ? SETTINGS_COPY.reminderEnabled
              : SETTINGS_COPY.reminderDisabled}
          </Text>
        </View>

        <Text style={styles.reminderLabel}>{SETTINGS_COPY.reminderTimeLabel}</Text>
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
              ? SETTINGS_COPY.reminderDisableButton
              : SETTINGS_COPY.reminderEnableButton
          }
          variant={reminderSettings.enabled ? 'ghost' : 'primary'}
          onPress={onToggleReminder}
        />
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{SETTINGS_COPY.architectureTitle}</Text>
        <Text style={styles.description}>{SETTINGS_COPY.architectureDescription}</Text>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={styles.title}>{SETTINGS_COPY.plannedTitle}</Text>
        <Text style={styles.description}>
          {SETTINGS_COPY.plannedDescription}
        </Text>
      </Card>
    </ScreenContainer>
  );
}
