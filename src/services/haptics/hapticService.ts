import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

const options = {
  enableVibrateFallback: false,
  ignoreAndroidSystemSettings: false,
};

export function hapticSave() {
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);
}

export function hapticImpactMedium() {
  ReactNativeHapticFeedback.trigger('impactMedium', options);
}

export function hapticImpactLight() {
  ReactNativeHapticFeedback.trigger('impactLight', options);
}

export function hapticUnlock() {
  ReactNativeHapticFeedback.trigger('notificationSuccess', options);
}
