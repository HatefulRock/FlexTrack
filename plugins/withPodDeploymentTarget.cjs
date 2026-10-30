// Xcode 26 and later refuse pod targets below iOS 15. A few resource bundles (AsyncStorage, SVG) still declare
// 12.4 or 13.4, which fails the build, so the generated Podfile raises any target below the floor.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const MARKER = '# withPodDeploymentTarget';

module.exports = (config, { floor = '15.1' } = {}) => withDangerousMod(config, ['ios', async mod => {
  const file = path.join(mod.modRequest.platformProjectRoot, 'Podfile');
  const podfile = fs.readFileSync(file, 'utf8');
  if (podfile.includes(MARKER)) return mod;
  const patch = `  post_install do |installer|
    ${MARKER}
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build|
        build.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '${floor}' if build.build_settings['IPHONEOS_DEPLOYMENT_TARGET'].to_f < 15.0
      end
    end
`;
  fs.writeFileSync(file, podfile.replace('  post_install do |installer|\n', patch));
  return mod;
}]);
