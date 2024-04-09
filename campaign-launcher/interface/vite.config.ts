import { resolve } from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import cjs from '@rollup/plugin-commonjs';
import nodePolyfills from 'rollup-plugin-polyfill-node';
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
      commonjsOptions: { include: [] },
      rollupOptions: {
        plugins: [
          // Enable rollup polyfills plugin
          // used during production bundling
          nodePolyfills({
            include: ['node_modules/**/*.js', '../../node_modules/**/*.js'],
          }),
          cjs(),
        ],
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
    optimizeDeps: {
      esbuildOptions: {
        // Node.js global to browser globalThis
        define: {
          global: 'globalThis',
        },
        // Enable esbuild polyfill plugins
        plugins: [
          NodeGlobalsPolyfillPlugin({
            process: true,
          }),
          NodeModulesPolyfillPlugin(),
        ],
      },
    },
  };
});
