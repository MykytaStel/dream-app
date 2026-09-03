import React from 'react';
import { Alert, Platform } from 'react-native';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';
import { SettingsSectionHeader } from './SettingsSectionHeader';
import { SettingsSegmentedControl } from './SettingsSegmentedControl';
import {
  APP_ICON_IDS,
  appIconsSupported,
  getCachedAppIconId,
  setAppIcon,
  syncAppIcon,
  type AppIconId,
} from '../services/appIconService';

type SettingsCopy = ReturnType<typeof getSettingsCopy>;
type SettingsStyles = ReturnType<typeof createSettingsScreenStyles>;

const LABEL_KEYS: Record<AppIconId, keyof SettingsCopy> = {
  default: 'appIconOptionDefault',
  ivory: 'appIconOptionIvory',
  sage: 'appIconOptionSage',
  night: 'appIconOptionNight',
  mono: 'appIconOptionMono',
};

/**
 * Choosing the home-screen icon. Absent on platforms that cannot change it —
 * for now that is Android, where the launcher-alias switch has not landed.
 */
export function SettingsAppIconSection({
  copy,
  styles,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
}) {
  const [selected, setSelected] = React.useState<AppIconId>(getCachedAppIconId);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    syncAppIcon().then(id => {
      if (active) {
        setSelected(id);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  const onSelect = React.useCallback(
    (id: AppIconId) => {
      if (busy || id === selected) {
        return;
      }

      const previous = selected;
      setSelected(id);
      setBusy(true);

      setAppIcon(id)
        .catch(() => {
          setSelected(previous);
          Alert.alert(copy.appIconErrorTitle, copy.appIconErrorDescription);
        })
        .finally(() => setBusy(false));
    },
    [busy, copy.appIconErrorDescription, copy.appIconErrorTitle, selected],
  );

  if (!appIconsSupported()) {
    return null;
  }

  const options = APP_ICON_IDS.map(id => ({
    value: id,
    label: copy[LABEL_KEYS[id]],
  }));

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.appIconTitle}
        description={copy.appIconDescription}
      />
      <SettingsSegmentedControl
        options={options}
        selectedValue={selected}
        onChange={onSelect}
        columns={2}
        minWidth={92}
      />
      {Platform.OS === 'android' ? (
        <Text style={styles.themeFootnote}>{copy.appIconAndroidHint}</Text>
      ) : null}
    </Card>
  );
}
