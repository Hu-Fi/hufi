import path from 'path';

import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const useSsl = process.env.VITE_USE_SSL === 'true';
const LOCAL_SSL_DOMAIN = 'ui.hufi.local';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      host: useSsl ? true : undefined,
      port: useSsl ? 443 : 3001,
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
      useSsl
        ? basicSsl({
            name: LOCAL_SSL_DOMAIN,
            domains: [LOCAL_SSL_DOMAIN, '127.0.0.1'],
          })
        : undefined,
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
