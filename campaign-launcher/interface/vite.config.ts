import { resolve } from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    server: {
      port: 3000,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
        },
      },
    },
    plugins: [
      nodePolyfills({
        protocolImports: true,
      }),
    ],
    build: {
      outDir: 'dist',
      sourcemap: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
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
