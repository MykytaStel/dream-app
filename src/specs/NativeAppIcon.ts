import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

/**
 * Swapping the home-screen icon.
 *
 * iOS only for now, through `setAlternateIconName`. Android needs a
 * launcher-alias switch that has not landed yet, so the module is absent there
 * and `TurboModuleRegistry.get` returns null rather than throwing — callers
 * treat a missing module as "not supported".
 *
 * Icons are addressed by the ids in `appIconService` ('default', 'ivory',
 * 'sage', 'night', 'mono'); 'default' is the primary icon.
 */
export interface Spec extends TurboModule {
  /** Whether the running platform can change the app icon at all. */
  isSupported(): Promise<boolean>;

  /** The id of the icon in use. 'default' when nothing is overridden. */
  getIcon(): Promise<string>;

  /**
   * Switches to the icon with this id. Rejects on an unknown id or when the
   * platform does not support alternate icons. iOS shows its own system alert
   * confirming the change.
   */
  setIcon(id: string): Promise<void>;
}

export default TurboModuleRegistry.get<Spec>('AppIcon');
