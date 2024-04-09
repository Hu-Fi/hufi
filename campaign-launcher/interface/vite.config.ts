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
        process: 'rollup-plugin-node-polyfills/polyfills/process-es6',
        buffer: 'rollup-plugin-node-polyfills/polyfills/buffer-es6',
        events: 'rollup-plugin-node-polyfills/polyfills/events',
        util: 'rollup-plugin-node-polyfills/polyfills/util',
        sys: 'util',
        stream: 'rollup-plugin-node-polyfills/polyfills/stream',
        _stream_duplex:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/duplex',
        _stream_passthrough:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/passthrough',
        _stream_readable:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/readable',
        _stream_writable:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/writable',
        _stream_transform:
          'rollup-plugin-node-polyfills/polyfills/readable-stream/transform',
      },
    },
    optimizeDeps: {},
  };
});
