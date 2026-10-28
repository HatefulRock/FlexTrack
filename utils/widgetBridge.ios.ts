import { ExtensionStorage } from '@bacons/apple-targets';
import { WidgetSnapshot } from './widgetData';

// Must match the App Group in app.json and targets/widget/expo-target.config.js.
export const WIDGET_APP_GROUP = 'group.com.HatefulRock.flextrack';
const storage = new ExtensionStorage(WIDGET_APP_GROUP);

export const publishWidgetSnapshot = async (snapshot: WidgetSnapshot) => {
  storage.set('snapshot', JSON.stringify(snapshot));
  ExtensionStorage.reloadWidget();
};
