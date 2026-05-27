import path from 'path';

import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const useSsl = process.env.VITE_USE_SSL === 'true';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 3001,
      // allow all in case reverse proxy or tunneling is used
      allowedHosts: true,
    },
    plugins: [
      react(),
      nodePolyfills({
        include: ['buffer'],
        globals: {
          /**
           * Needed for @human-protocol/sdk, which uses Node.js buffer under the hood
           */
          Buffer: true,
          global: false,
          process: false,
        },
        protocolImports: true,
      }),
      useSsl ? basicSsl() : undefined,
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
        '@': path.resolve(__dirname, 'src'),
        buffer: 'buffer/',
      },
    },
  };
});
