import React from 'react';
import { InteractionManager, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '@shopify/restyle';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { Text } from '../../../components/ui/Text';
import { getDreamCopy } from '../../../constants/copy/dreams';
import { useI18n } from '../../../i18n/I18nProvider';
import { Theme } from '../../../theme/theme';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import { openNewDreamTab } from '../../../app/navigation/navigationRef';
import { getDreamDraft } from '../services/dreamDraftService';
import { createWakeEntryScreenStyles } from './WakeEntryScreen.styles';

export default function WakeEntryScreen() {
  const t = useTheme<Theme>();
  const styles = React.useMemo(() => createWakeEntryScreenStyles(t), [t]);
  const insets = useSafeAreaInsets();
  const { locale } = useI18n();
  const copy = React.useMemo(() => getDreamCopy(locale), [locale]);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList, typeof ROOT_ROUTE_NAMES.WakeEntry>>();
  const [hasDraft, setHasDraft] = React.useState(false);
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    setHasDraft(Boolean(getDreamDraft()));
  }, []);

  React.useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration: 9000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [pulse, rotation]);

  const outerHaloStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + pulse.value * 0.16,
    transform: [{ scale: 1 + pulse.value * 0.08 }],
  }));
  const innerHaloStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + pulse.value * 0.12,
    transform: [{ scale: 1 + pulse.value * 0.05 }],
  }));
  const orbFloatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: pulse.value * -4 }, { scale: 1 + pulse.value * 0.015 }],
  }));
  const clusterRotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value * 360}deg` }],
  }));

  const handoffToComposer = React.useCallback(
    (entryMode: 'voice' | 'wake') => {
      navigation.goBack();
      InteractionManager.runAfterInteractions(() => {
        openNewDreamTab(
          entryMode === 'voice'
            ? { entryMode, launchKey: Date.now() }
            : { entryMode: 'wake' },
        );
      });
    },
    [navigation],
  );

  return (
    <View style={styles.root}>
      <View pointerEvents="none" style={styles.glowTop} />
      <View pointerEvents="none" style={styles.glowLeft} />
      <View pointerEvents="none" style={styles.glowBottom} />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + t.spacing.md,
            paddingBottom: insets.bottom + t.spacing.lg,
          },
        ]}
      >
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={copy.clearErrorAction}
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [
              styles.closeButton,
              pressed ? styles.closeButtonPressed : null,
            ]}
          >
            <Ionicons name="close" size={20} color={t.colors.text} />
          </Pressable>
        </View>

        <View style={styles.main}>
          <Animated.View entering={FadeInDown.duration(220)} style={styles.hero}>
            <Text style={styles.eyebrow}>{copy.wakeEntryKicker}</Text>
            <Text style={styles.title}>{copy.wakeEntryTitle}</Text>
            <Text style={styles.description}>{copy.wakeEntryDescription}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(40).duration(240)} style={styles.stage}>
            <View style={styles.orbStage}>
              <Animated.View style={[styles.haloOuter, outerHaloStyle]} />
              <Animated.View style={[styles.haloInner, innerHaloStyle]} />
              <Pressable
                accessibilityHint={copy.wakeEntryOrbHint}
                accessibilityLabel={copy.wakeEntryWriteAction}
                accessibilityRole="button"
                onPress={() => handoffToComposer('wake')}
                style={({ pressed }) => [
                  styles.orbPressable,
                  pressed ? styles.orbPressablePressed : null,
                ]}
              >
                <Animated.View style={[styles.orbSurface, orbFloatStyle]}>
                  <View pointerEvents="none" style={styles.orbAura} />
                  <View pointerEvents="none" style={styles.orbAuraSecondary} />
                  <Animated.View style={[styles.kaleidoscopeCluster, clusterRotationStyle]}>
                    <View style={[styles.kaleidoscopeFacet, styles.kaleidoscopeFacetPrimary]} />
                    <View style={[styles.kaleidoscopeFacet, styles.kaleidoscopeFacetAccent]} />
                    <View style={[styles.kaleidoscopeFacet, styles.kaleidoscopeFacetAlt]} />
                  </Animated.View>
                  <Text style={styles.orbLabel}>{copy.wakeEntryOrbAction}</Text>
                </Animated.View>
              </Pressable>
            </View>
            <Text style={styles.orbHint}>{copy.wakeEntryOrbHint}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(70).duration(240)} style={styles.actions}>
            <Button
              title={copy.wakeEntryWriteAction}
              size="lg"
              icon="create-outline"
              onPress={() => handoffToComposer('wake')}
            />
            {hasDraft ? (
              <View style={styles.secondaryActions}>
                <Button
                  title={copy.wakeEntrySpeakAction}
                  variant="ghost"
                  icon="mic-outline"
                  onPress={() => handoffToComposer('voice')}
                  style={styles.secondaryAction}
                />
                <Button
                  title={copy.wakeEntryDraftAction}
                  variant="ghost"
                  icon="document-text-outline"
                  onPress={() => handoffToComposer('wake')}
                  style={styles.secondaryAction}
                />
              </View>
            ) : (
              <Button
                title={copy.wakeEntrySpeakAction}
                variant="ghost"
                icon="mic-outline"
                onPress={() => handoffToComposer('voice')}
              />
            )}
          </Animated.View>
        </View>
      </View>
    </View>
  );
}
