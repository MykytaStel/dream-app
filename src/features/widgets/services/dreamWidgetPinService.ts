import NativeDreamWidget from '../../../specs/NativeDreamWidget';
import { kv } from '../../../services/storage/mmkv';
import { WIDGET_PIN_PROMPT_SEEN_KEY } from '../../../services/storage/keys';

/**
 * The platform checks that used to wrap each of these are gone.
 *
 * They were standing in for a boundary that did not exist: iOS exported
 * `getWidgetStatus` and not the pin methods, Android the reverse, and the
 * TypeScript declared all three optional. `Platform.OS !== 'android'` was doing
 * the job the type system should have done — and doing it wrong, since Android
 * can answer `getWidgetStatus` perfectly well and was hard-coded to `false`,
 * which meant it could invite someone to add a widget they already had.
 *
 * Both platforms now implement the whole spec, each answering honestly for
 * itself. iOS returns false for the pin methods because iOS has no such API.
 */

export function hasWidgetPinPromptBeenSeen(): boolean {
  return kv.getBoolean(WIDGET_PIN_PROMPT_SEEN_KEY) === true;
}

export function markWidgetPinPromptSeen(): void {
  kv.set(WIDGET_PIN_PROMPT_SEEN_KEY, true);
}

export async function isWidgetAlreadyAdded(): Promise<boolean> {
  try {
    const result = await NativeDreamWidget.getWidgetStatus();
    return result.hasWidget;
  } catch {
    return false;
  }
}

export async function requestPinWidget(): Promise<boolean> {
  try {
    return await NativeDreamWidget.requestPinWidget();
  } catch {
    return false;
  }
}

export async function isPinNativelySupported(): Promise<boolean> {
  try {
    return await NativeDreamWidget.isPinSupported();
  } catch {
    return false;
  }
}
