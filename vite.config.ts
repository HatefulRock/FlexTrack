import path from 'path';
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: { port: 3000, host: '0.0.0.0' },
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
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: [
        { find: /^react-native$/, replacement: 'react-native-web' },
        { find: /^react-native-safe-area-context$/, replacement: path.resolve(__dirname, 'shims/safeArea.tsx') },
        { find: /^expo-linear-gradient$/, replacement: path.resolve(__dirname, 'shims/linearGradient.tsx') },
        { find: /^expo-haptics$/, replacement: path.resolve(__dirname, 'shims/haptics.ts') },
        { find: /^expo-keep-awake$/, replacement: path.resolve(__dirname, 'shims/keepAwake.ts') },
        { find: /^react-native-svg$/, replacement: path.resolve(__dirname, 'node_modules/react-native-svg/lib/module/elements.web.js') },
        { find: '@', replacement: path.resolve(__dirname, '.') },
      ],
    },
  };
});




