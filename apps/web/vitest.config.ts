import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['i18n/**/*.test.ts'],
    exclude: ['.next/**', 'node_modules/**'],
  },
});
