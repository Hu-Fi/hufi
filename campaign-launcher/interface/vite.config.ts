import { resolve } from 'path';
import inject from '@rollup/plugin-inject';
import { defineConfig } from 'vite';

const proxyHost = process.env.PROXY_HOST || 'localhost';
const proxyPort = process.env.PROXY_PORT || '5000';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      proxy: {
        '/api': `http://${proxyHost}:${proxyPort}`,
      },
    },
    plugins: [],
    build: {
      outDir: 'dist',
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        plugins: [inject({ Buffer: ['Buffer', 'Buffer'], process: 'process' })],
        onwarn(warning, defaultHandler) {
          if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
            return;
          }

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
      },
    },
    optimizeDeps: {},
  };
});
