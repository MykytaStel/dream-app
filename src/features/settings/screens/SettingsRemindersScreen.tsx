import React from 'react';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { listDreamListItems } from '../../dreams/repository/dreamsRepository';
import { getOptimalReminderTime } from '../../reminders/services/dreamReminderService';
import { logActionError } from '../../../app/errorReporting';
import { formatReminderTime } from '../model/settingsPresentation';
import { ReminderSection } from '../components/SettingsTopSections';
import { useSettingsSpoke } from './useSettingsSpoke';

/**
 * When the app asks about last night.
 *
 * The suggestion logic lives here rather than in the controller because it is
 * the only thing that reads the dream list to answer a settings question, and
 * only this screen can act on the answer.
 */
export default function SettingsRemindersScreen() {
  const { copy, styles, controller, locale } = useSettingsSpoke();

  const suggestedReminderTime = React.useMemo(() => {
    const dreams = listDreamListItems();
    const optimal = getOptimalReminderTime(dreams);
    if (!optimal) {
      return null;
    }
    // Don't suggest if it matches the current setting
    if (
      optimal.hour === controller.reminderSettings.hour &&
      optimal.minute === controller.reminderSettings.minute
    ) {
      return null;
    }
    return optimal;
  }, [controller.reminderSettings.hour, controller.reminderSettings.minute]);

  const suggestedTime = React.useMemo(() => {
    if (!suggestedReminderTime) {
      return null;
    }

    return {
      label: formatReminderTime(
        {
          enabled: true,
          hour: suggestedReminderTime.hour,
          minute: suggestedReminderTime.minute,
          style: controller.reminderSettings.style,
        },
        locale,
      ),
    };
  }, [controller.reminderSettings.style, locale, suggestedReminderTime]);

  const onApplySuggestedTime = React.useCallback(() => {
    if (!suggestedReminderTime) {
      return;
    }

    controller
      .onSelectReminderTime(
        suggestedReminderTime.hour,
        suggestedReminderTime.minute,
      )
      .catch(e =>
        logActionError('SettingsRemindersScreen.onApplySuggestedTime', e),
      );
  }, [controller, suggestedReminderTime]);

  return (
    <ScreenContainer scroll withTopInset={false}>
      <ReminderSection
        copy={copy}
        styles={styles}
        reminderSettings={controller.reminderSettings}
        permissionGranted={controller.permissionGranted}
        isApplyingReminder={controller.isApplyingReminder}
        reminderTime={controller.reminderTime}
        showIosTimePicker={controller.showIosTimePicker}
        pickerLocale={controller.pickerLocale}
        suggestedTime={suggestedTime}
        getReminderDate={controller.getReminderDate}
        onToggleReminder={() =>
          controller
            .onToggleReminder()
            .catch(e =>
              logActionError('SettingsRemindersScreen.onToggleReminder', e),
            )
        }
        onOpenReminderTimePicker={controller.onOpenReminderTimePicker}
        onNativeTimePickerChange={controller.onNativeTimePickerChange}
        onApplySuggestedTime={onApplySuggestedTime}
        onSelectReminderStyle={style =>
          controller
            .onSelectReminderStyle(style)
            .catch(e =>
              logActionError(
                'SettingsRemindersScreen.onSelectReminderStyle',
                e,
              ),
            )
        }
      />
    </ScreenContainer>
  );
}
