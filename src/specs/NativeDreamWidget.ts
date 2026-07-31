import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * The home-screen widget, as a typed boundary.
 *
 * This was two hand-written bridges — an Objective-C macro block listing method
 * signatures as strings on iOS, and `@ReactMethod` annotations on Android —
 * with the JavaScript side asserting a shape onto `NativeModules` and hoping.
 * Nothing checked that the three descriptions agreed. They did not: iOS
 * exported `getWidgetStatus` and not the pin methods, Android exported the pin
 * methods and not `getWidgetStatus`, and the TypeScript declared a union of
 * both with every member optional, so a call to a method that did not exist on
 * the running platform read as `undefined` and silently did nothing.
 *
 * Codegen makes this file the single source. Both platforms must implement all
 * of it or they fail to compile.
 */
export interface Spec extends TurboModule {
  /**
   * Hands the widget the JSON it renders from. Rejects when the App Group is
   * missing on iOS, or the payload is not valid JSON on Android.
   */
  updateSnapshot(snapshotJson: string): Promise<void>;

  /**
   * Whether the user currently has a widget placed.
   *
   * Answered honestly on both platforms now. It used to be iOS-only, with
   * JavaScript short-circuiting Android to `false` — which meant Android could
   * prompt someone to add a widget they already had.
   */
  getWidgetStatus(): Promise<{ hasWidget: boolean }>;

  /**
   * Whether the platform can offer an "add this widget" prompt. Only Android
   * can; iOS has no API for it and answers false.
   */
  isPinSupported(): Promise<boolean>;

  /** Asks the system to show that prompt. False when it is unavailable. */
  requestPinWidget(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('DreamWidget');
