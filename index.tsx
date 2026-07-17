import { AppRegistry, Platform } from 'react-native';
import App from './App';

AppRegistry.registerComponent('main', () => App);

if (Platform.OS === 'web') {
  const root = document.getElementById('root');
  if (root) AppRegistry.runApplication('main', { rootTag: root });
}

