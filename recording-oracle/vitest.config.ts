import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    watch: false,
    clearMocks: true,
    expect: {
      requireAssertions: true,
    },
    hideSkippedTests: true,
    setupFiles: ['./src/setup-libs.ts'],
  },
});
