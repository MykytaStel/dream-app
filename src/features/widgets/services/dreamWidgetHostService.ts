import NativeDreamWidget from '../../../specs/NativeDreamWidget';
import { DreamWidgetSnapshot } from '../model/dreamWidget';

/**
 * The snapshot the home-screen widget renders from.
 *
 * The module used to be read off `NativeModules` with a hand-written type
 * asserted onto it, and every call guarded by `if (!module?.method)` — a guard
 * that could not distinguish "this platform does not have it" from "the name
 * was misspelled somewhere". `getEnforcing` throws at startup if the module is
 * missing at all, and the method is typed from the same spec both platforms
 * compile against.
 */
export async function publishDreamWidgetSnapshot(
  snapshot: DreamWidgetSnapshot,
) {
  await NativeDreamWidget.updateSnapshot(JSON.stringify(snapshot));
}
