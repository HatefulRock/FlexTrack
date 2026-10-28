// Adds the Wear OS companion app in wear/ to the generated Android project as the :wear module.
// It builds separately from the phone app: ./gradlew :wear:bundleRelease (see the "wear" EAS profile).
const fs = require('fs');
const path = require('path');
const { withDangerousMod, withSettingsGradle } = require('expo/config-plugins');

const withWearSources = config => withDangerousMod(config, ['android', mod => {
  const root = mod.modRequest.projectRoot;
  const target = path.join(mod.modRequest.platformProjectRoot, 'wear');
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(path.join(root, 'wear'), target, { recursive: true });
  const icons = path.join(target, 'src/main/res/drawable-nodpi');
  fs.mkdirSync(icons, { recursive: true });
  fs.copyFileSync(path.join(root, 'assets/images/flextrack.png'), path.join(icons, 'ic_launcher.png'));
  return mod;
}]);

const withWearModule = config => withSettingsGradle(config, mod => {
  if (!/include\s*\(?\s*['"]:wear['"]/.test(mod.modResults.contents)) mod.modResults.contents += "\ninclude ':wear'\n";
  return mod;
});

module.exports = config => withWearModule(withWearSources(config));
