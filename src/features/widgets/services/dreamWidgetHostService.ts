import { NativeModules, Platform } from 'react-native';
import { DreamWidgetSnapshot } from '../model/dreamWidget';

type DreamWidgetNativeModule = {
  updateSnapshot(snapshotJson: string): Promise<void>;
};

const dreamWidgetNativeModule =
  Platform.OS === 'android'
    ? (NativeModules as { DreamWidget?: DreamWidgetNativeModule }).DreamWidget
    : undefined;

export async function publishDreamWidgetSnapshot(snapshot: DreamWidgetSnapshot) {
  if (!dreamWidgetNativeModule?.updateSnapshot) {
    return;
  }

  await dreamWidgetNativeModule.updateSnapshot(JSON.stringify(snapshot));
}
