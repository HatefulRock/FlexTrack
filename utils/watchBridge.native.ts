import { requireOptionalNativeModule } from 'expo';
import { WatchSnapshot } from './watchData';

// Local module in modules/flextrack-watch: WatchConnectivity on iOS, the Wear OS Data Layer on Android.
const native = requireOptionalNativeModule<{ isSupported(): boolean; updateSnapshot(json: string): Promise<void> }>('FlexTrackWatch');

export const publishWatchSnapshot = async (snapshot: WatchSnapshot) => {
  if (!native?.isSupported()) return;
  await native.updateSnapshot(JSON.stringify(snapshot));
};
