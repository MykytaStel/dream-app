import React from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { logActionError } from '../../../app/errorReporting';
import {
  ROOT_ROUTE_NAMES,
  type RootStackParamList,
} from '../../../app/navigation/routes';
import {
  BiometricLockSection,
  PrivacySection,
} from '../components/SettingsTopSections';
import { useSettingsSpoke } from './useSettingsSpoke';

/**
 * Who can open the app, and where what they would read is kept.
 *
 * The lock and the storage answers were two sections apart in the old scroll,
 * with backup between them, which asked someone worried about privacy to read
 * three unrelated screens' worth to find both halves of the answer.
 */
export default function SettingsSecurityScreen() {
  const { copy, styles, controller } = useSettingsSpoke();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <ScreenContainer scroll withTopInset={false}>
      <BiometricLockSection
        copy={copy}
        styles={styles}
        biometricAvailability={controller.biometricAvailability}
        biometricLockEnabled={controller.biometricLockEnabled}
        isApplyingBiometricLock={controller.isApplyingBiometricLock}
        onToggleBiometricLock={() =>
          controller
            .onToggleBiometricLock()
            .catch(e =>
              logActionError('SettingsSecurityScreen.onToggleBiometricLock', e),
            )
        }
      />

      <PrivacySection
        copy={copy}
        styles={styles}
        privacyHighlights={controller.privacyHighlights}
        onOpenPrivacy={() => navigation.navigate(ROOT_ROUTE_NAMES.Privacy)}
      />
    </ScreenContainer>
  );
}
