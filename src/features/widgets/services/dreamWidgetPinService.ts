import { Platform } from 'react-native';
import { NativeModules } from 'react-native';
import { kv } from '../../../services/storage/mmkv';
import { WIDGET_PIN_PROMPT_SEEN_KEY } from '../../../services/storage/keys';

type DreamWidgetPinNativeModule = {
  getWidgetStatus?: () => Promise<{ hasWidget: boolean }>;
  requestPinWidget?: () => Promise<boolean>;
  isPinSupported?: () => Promise<boolean>;
};

const nativeModule = (NativeModules as { DreamWidget?: DreamWidgetPinNativeModule }).DreamWidget;

export function hasWidgetPinPromptBeenSeen(): boolean {
  return kv.getBoolean(WIDGET_PIN_PROMPT_SEEN_KEY) === true;
}

export function markWidgetPinPromptSeen(): void {
  kv.set(WIDGET_PIN_PROMPT_SEEN_KEY, true);
}

export async function isWidgetAlreadyAdded(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !nativeModule?.getWidgetStatus) {
    return false;
  }
  try {
    const result = await nativeModule.getWidgetStatus();
    return result.hasWidget;
  } catch {
    return false;
  }
}

export async function requestPinWidget(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeModule?.requestPinWidget) {
    return false;
  }
  try {
    return await nativeModule.requestPinWidget();
  } catch {
    return false;
  }
}

export async function isPinNativelySupported(): Promise<boolean> {
  if (Platform.OS !== 'android' || !nativeModule?.isPinSupported) {
    return false;
  }
  try {
    return await nativeModule.isPinSupported();
  } catch {
    return false;
  }
}
