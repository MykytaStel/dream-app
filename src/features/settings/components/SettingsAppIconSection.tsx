import React from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { useTheme } from '@shopify/restyle';
import { Card } from '../../../components/ui/Card';
import { Text } from '../../../components/ui/Text';
import { getSettingsCopy } from '../../../constants/copy/settings';
import { Theme } from '../../../theme/theme';
import { createSettingsScreenStyles } from '../screens/SettingsScreen.styles';
import { SettingsSectionHeader } from './SettingsSectionHeader';
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

const PREVIEWS: Record<AppIconId, ImageSourcePropType> = {
  default: require('../assets/appIcons/default.png'),
  ivory: require('../assets/appIcons/ivory.png'),
  sage: require('../assets/appIcons/sage.png'),
  night: require('../assets/appIcons/night.png'),
  mono: require('../assets/appIcons/mono.png'),
};

/**
 * Choosing the home-screen icon. Absent where the platform cannot change it.
 * Each option shows the actual icon so the choice is a picture, not a word.
 */
export function SettingsAppIconSection({
  copy,
  styles,
}: {
  copy: SettingsCopy;
  styles: SettingsStyles;
}) {
  const theme = useTheme<Theme>();
  const local = React.useMemo(() => createStyles(theme), [theme]);
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

  return (
    <Card style={styles.sectionCard}>
      <SettingsSectionHeader
        title={copy.appIconTitle}
        description={copy.appIconDescription}
      />
      <View style={local.grid} accessibilityRole="radiogroup">
        {APP_ICON_IDS.map(id => {
          const isSelected = id === selected;
          const label = copy[LABEL_KEYS[id]];

          return (
            <Pressable
              key={id}
              onPress={() => onSelect(id)}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
              style={local.tile}
            >
              <Image
                source={PREVIEWS[id]}
                style={[local.thumb, isSelected ? local.thumbSelected : null]}
              />
              <Text
                style={[local.label, isSelected ? local.labelSelected : null]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {Platform.OS === 'android' ? (
        <Text style={styles.themeFootnote}>{copy.appIconAndroidHint}</Text>
      ) : null}
    </Card>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    tile: {
      width: '30%',
      flexGrow: 1,
      alignItems: 'center',
      gap: 6,
    },
    thumb: {
      width: 56,
      height: 56,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    thumbSelected: {
      borderColor: theme.colors.primary,
    },
    label: {
      fontSize: 12,
      color: theme.colors.textDim,
      textAlign: 'center',
    },
    labelSelected: {
      color: theme.colors.text,
      fontWeight: '700',
    },
  });
}
