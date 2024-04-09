import { resolve } from 'path';
import inject from '@rollup/plugin-inject';
import { defineConfig } from 'vite';

const proxyApi = process.env.PROXY_API || 'http://localhost:5000';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      proxy: {
        '/api': proxyApi,
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
        plugins: [inject({ Buffer: ['buffer/', 'Buffer'] })],
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
        buffer: 'buffer/',
      },
    },
    optimizeDeps: {},
  };
});
