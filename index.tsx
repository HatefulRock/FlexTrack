import { AppRegistry, Platform } from 'react-native';
import App from './App';
import { registerWidgets } from './widgets/registerWidgets';

AppRegistry.registerComponent('main', () => App);
registerWidgets();

if (Platform.OS === 'web') {
  const root = document.getElementById('root');
  if (root) AppRegistry.runApplication('main', { rootTag: root as never, initialProps: {} }); // react-native-web takes a DOM node, native typings a number
}

