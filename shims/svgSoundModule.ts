// react-native-svg's Android touch-sound module. Its source imports TurboModuleRegistry, which react-native-web
// doesn't export: the production build only warns, but the dev server's dependency pre-bundling stops on it.
// The module is only required on Android, so the web build never calls this.
export default { playTouchSound() {} };
