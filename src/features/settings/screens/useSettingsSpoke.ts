import React from 'react';
import { useTheme } from '@shopify/restyle';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { useI18n } from '../../../i18n/I18nProvider';
import { createSettingsScreenStyles } from './SettingsScreen.styles';
import { useSettingsScreenController } from '../hooks/useSettingsScreenController';

/**
 * The four lines every settings screen opened with.
 *
 * Settings used to be one scroll of nine sections. Splitting it into a hub and
 * its spokes meant six screens instead of one, and without this each of them
 * would repeat the same locale lookup, copy memo, style memo and controller
 * call — the kind of duplication that stays correct for about a month.
 *
 * The controller is called per screen rather than lifted into a provider. Each
 * spoke mounts only when someone opens it, so the work it does — reading the
 * biometric capability, the transcription model status, the cloud session — is
 * done for the one screen that asked, not for all six on every visit to the
 * tab.
 */
export function useSettingsSpoke() {
  const theme = useTheme<Theme>();
  const { locale, setLocale } = useI18n();
  const copy = React.useMemo(() => getSettingsCopy(locale), [locale]);
  const styles = React.useMemo(
    () => createSettingsScreenStyles(theme),
    [theme],
  );
  const controller = useSettingsScreenController({ locale, setLocale, copy });

  return { copy, styles, controller, locale };
}
