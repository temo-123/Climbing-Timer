import './utils/silenceExpoGoWarnings'; // must be first — patches console before any module loads
import 'react-native-get-random-values'; // must load before jsencrypt (utils/auth.ts) touches crypto.getRandomValues
import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
