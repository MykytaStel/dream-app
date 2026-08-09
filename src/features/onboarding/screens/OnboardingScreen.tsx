import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/Text';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import { fontFamilies } from '../../../theme/fonts';
import { getOnboardingCopy } from '../../../constants/copy/onboarding';
import { markOnboardingSeen } from '../services/onboardingService';
import {
  ROOT_ROUTE_NAMES,
  TAB_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';

type CaptureEntryMode = 'default' | 'voice';

export default function OnboardingScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const copy = React.useMemo(() => getOnboardingCopy(locale), [locale]);
  const styles = React.useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );

  const finish = React.useCallback(
    (entryMode: CaptureEntryMode) => {
      markOnboardingSeen();
      navigation.replace(ROOT_ROUTE_NAMES.Tabs, {
        screen: TAB_ROUTE_NAMES.New,
        params: {
          entryMode,
          autoStartRecording: entryMode === 'voice',
        },
      });
    },
    [navigation],
  );

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeIn.duration(260)} style={styles.content}>
        <View style={styles.iconArea}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
          <View style={styles.iconWrap}>
            <Ionicons
              name="moon-outline"
              size={32}
              color={theme.colors.primary}
            />
          </View>
        </View>

        <Text style={styles.eyebrow}>{copy.promiseEyebrow}</Text>
        <Text style={styles.title}>{copy.promiseTitle}</Text>
        <Text style={styles.description}>{copy.promiseDescription}</Text>
      </Animated.View>

      <View style={styles.bottom}>
        <Button
          title={copy.voiceAction}
          onPress={() => finish('voice')}
          size="lg"
          icon="mic-outline"
        />
        <Button
          title={copy.textAction}
          onPress={() => finish('default')}
          variant="ghost"
          size="lg"
          icon="create-outline"
        />
        <Button
          title={copy.noMemoryAction}
          onPress={() => finish('default')}
          variant="ghost"
          size="sm"
        />
      </View>
    </View>
  );
}

function createStyles(theme: Theme, topInset: number, bottomInset: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: theme.spacing.xl,
      paddingTop: topInset + theme.spacing.lg,
    },
    content: {
      flex: 1,
      justifyContent: 'center',
      gap: 16,
    },
    iconArea: {
      width: 96,
      height: 96,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    glowOuter: {
      position: 'absolute',
      width: 96,
      height: 96,
      borderRadius: 999,
      backgroundColor: theme.colors.primaryAlt,
      opacity: 0.1,
    },
    glowInner: {
      position: 'absolute',
      width: 64,
      height: 64,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      opacity: 0.12,
    },
    iconWrap: {
      width: 64,
      height: 64,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: theme.colors.surfaceElevated,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.glow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 18,
      elevation: 6,
    },
    eyebrow: {
      color: theme.colors.accent,
      fontFamily: fontFamilies.sans,
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: {
      fontFamily: fontFamilies.display,
      fontSize: 34,
      lineHeight: 40,
      color: theme.colors.text,
      letterSpacing: -0.3,
    },
    description: {
      color: theme.colors.textDim,
      fontFamily: fontFamilies.sans,
      fontSize: 16,
      lineHeight: 24,
    },
    bottom: {
      paddingBottom: bottomInset + theme.spacing.xl,
      gap: theme.spacing.sm,
    },
  });
}
