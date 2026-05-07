import { defineConfig } from 'vite';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage'
    }
  }
});
