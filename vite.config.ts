import path from 'path';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    server: { port: 3000, host: '0.0.0.0' },
    // react-native-web's Animated reads `global`, which browsers don't define.
    define: { global: 'globalThis' },
    optimizeDeps: { esbuildOptions: { loader: { '.js': 'jsx' } } },
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
        { find: /^react-native-svg$/, replacement: path.resolve(__dirname, 'node_modules/react-native-svg/lib/module/elements.web.js') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
  };
});




