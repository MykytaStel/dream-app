import { NativeModules } from 'react-native';
import { DreamWidgetSnapshot } from '../model/dreamWidget';

type DreamWidgetNativeModule = {
  updateSnapshot(snapshotJson: string): Promise<void>;
};

const dreamWidgetNativeModule = (NativeModules as { DreamWidget?: DreamWidgetNativeModule })
  .DreamWidget;

export async function publishDreamWidgetSnapshot(snapshot: DreamWidgetSnapshot) {
  if (!dreamWidgetNativeModule?.updateSnapshot) {
    return;
  }

  await dreamWidgetNativeModule.updateSnapshot(JSON.stringify(snapshot));
}
