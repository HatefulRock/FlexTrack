import path from 'path';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

const svgSoundShim = path.resolve(__dirname, 'shims/svgSoundModule.ts');

export default defineConfig(() => {
  return {
    // localhost only; run `npm run dev -- --host` to test from a phone on the same network.
    server: { port: 3000 },
    // react-native-web's Animated reads `global`, which browsers don't define.
    define: { global: 'globalThis' },
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
        // Aliases don't reach relative imports inside pre-bundled dependencies, so the svg sound-module shim
        // (see shims/svgSoundModule.ts) is swapped in here for the dev server; the alias below covers the build.
        plugins: [{
          name: 'svg-sound-module-shim',
          setup(build) { build.onResolve({ filter: /\/fabric\/NativeSvgSoundModule(\.js)?$/ }, () => ({ path: svgSoundShim })); },
        }],
      },
    },
    plugins: [
      {
        name: 'react-native-js-as-jsx',
        enforce: 'pre',
        async transform(code, id) {
          if (id.includes('react-native-chart-kit') && id.endsWith('.js')) {
            return transformWithEsbuild(code, id, { loader: 'jsx', jsx: 'automatic' });
          }
        },
      },
      react(),
    ],
    resolve: {
      alias: [
        { find: /^react-native$/, replacement: 'react-native-web' },
        { find: /^react-native-safe-area-context$/, replacement: path.resolve(__dirname, 'shims/safeArea.tsx') },
        { find: /^expo-linear-gradient$/, replacement: path.resolve(__dirname, 'shims/linearGradient.tsx') },
        { find: /^expo-haptics$/, replacement: path.resolve(__dirname, 'shims/haptics.ts') },
        { find: /^expo-notifications$/, replacement: path.resolve(__dirname, 'shims/notifications.ts') },
        { find: /^expo-file-system$/, replacement: path.resolve(__dirname, 'shims/fileSystem.ts') },
        { find: /^expo-sharing$/, replacement: path.resolve(__dirname, 'shims/sharing.ts') },
        { find: /^react-native-view-shot$/, replacement: path.resolve(__dirname, 'shims/viewShot.tsx') },
        { find: /^expo-keep-awake$/, replacement: path.resolve(__dirname, 'shims/keepAwake.ts') },
        { find: /^(\.{1,2}\/)+hooks\/useAppFonts$/, replacement: path.resolve(__dirname, 'hooks/useAppFonts.web.ts') },
        { find: /^\.\.\/fabric\/NativeSvgSoundModule(\.js)?$/, replacement: svgSoundShim },
        { find: /^react-native-svg$/, replacement: path.resolve(__dirname, 'node_modules/react-native-svg/lib/module/elements.web.js') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
  };
});




