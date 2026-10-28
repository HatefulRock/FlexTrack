import { ConfigContext, ExpoConfig } from 'expo/config';

// The Apple Team ID signs the widget extension. It is kept out of this public repo: set APPLE_TEAM_ID
// in .env.local for local builds and as an EAS environment variable for cloud builds.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'FlexTrack',
  slug: config.slug ?? 'flex-track',
  ios: { ...config.ios, appleTeamId: process.env.APPLE_TEAM_ID || undefined },
});
