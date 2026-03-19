import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 3001,
    },
    plugins: [
      react(),
      nodePolyfills({
        protocolImports: true,
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: true,
      rolldownOptions: {
        onwarn(warning, defaultHandler) {
          if (warning.code === 'SOURCEMAP_ERROR') {
            return;
          }

          defaultHandler(warning);
        },
      },
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        buffer: 'buffer/',
      },
    },
  };
});
