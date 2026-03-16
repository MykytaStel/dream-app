import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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
import { ROOT_ROUTE_NAMES, type RootStackParamList } from '../../../app/navigation/routes';

type Slide = {
  id: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
};

export default function OnboardingScreen() {
  const theme = useTheme<Theme>();
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const copy = React.useMemo(() => getOnboardingCopy(locale), [locale]);
  const styles = React.useMemo(
    () => createStyles(theme, insets.top, insets.bottom),
    [theme, insets.top, insets.bottom],
  );

  const slides = React.useMemo<Slide[]>(
    () => [
      {
        id: 'capture',
        icon: 'moon-outline',
        eyebrow: copy.slide1Eyebrow,
        title: copy.slide1Title,
        description: copy.slide1Description,
      },
      {
        id: 'explore',
        icon: 'sparkles-outline',
        eyebrow: copy.slide2Eyebrow,
        title: copy.slide2Title,
        description: copy.slide2Description,
      },
      {
        id: 'private',
        icon: 'lock-closed-outline',
        eyebrow: copy.slide3Eyebrow,
        title: copy.slide3Title,
        description: copy.slide3Description,
      },
    ],
    [copy],
  );

  const [index, setIndex] = React.useState(0);
  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const finish = React.useCallback(() => {
    markOnboardingSeen();
    navigation.replace(ROOT_ROUTE_NAMES.Tabs);
  }, [navigation]);

  const handleNext = React.useCallback(() => {
    if (isLast) {
      finish();
    } else {
      setIndex(i => i + 1);
    }
  }, [finish, isLast]);

  return (
    <View style={styles.root}>
      {/* Skip */}
      <View style={styles.topBar}>
        {!isLast ? (
          <Pressable
            onPress={finish}
            style={({ pressed }) => [styles.skipButton, pressed ? styles.skipButtonPressed : null]}
          >
            <Text style={styles.skipLabel}>{copy.skipAction}</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* Slide content — key forces remount + FadeIn on index change */}
      <Animated.View key={slide.id} entering={FadeIn.duration(260)} style={styles.content}>
        <View style={styles.iconArea}>
          <View style={styles.glowOuter} />
          <View style={styles.glowInner} />
          <View style={styles.iconWrap}>
            <Ionicons name={slide.icon} size={32} color={theme.colors.primary} />
          </View>
        </View>

        <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.description}>{slide.description}</Text>
      </Animated.View>

      {/* Bottom */}
      <View style={styles.bottom}>
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.id}
              style={[styles.dot, i === index ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <Button
          title={isLast ? copy.getStartedAction : copy.continueAction}
          onPress={handleNext}
          size="lg"
          icon={isLast ? 'arrow-forward-outline' : undefined}
          iconPosition="right"
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
    },
    topBar: {
      paddingTop: topInset + theme.spacing.sm,
      alignItems: 'flex-end',
      height: topInset + 52,
      justifyContent: 'flex-end',
    },
    skipButton: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    skipButtonPressed: {
      opacity: 0.5,
    },
    skipLabel: {
      color: theme.colors.textDim,
      fontSize: 14,
      fontFamily: fontFamilies.sans,
      fontWeight: '500',
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
      gap: theme.spacing.lg,
    },
    dots: {
      flexDirection: 'row',
      gap: 7,
      alignSelf: 'center',
    },
    dot: {
      height: 6,
      borderRadius: 999,
    },
    dotActive: {
      width: 22,
      backgroundColor: theme.colors.primary,
    },
    dotInactive: {
      width: 6,
      backgroundColor: theme.colors.border,
    },
  });
}
