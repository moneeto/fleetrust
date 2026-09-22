// @ts-check
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

/**
 * Config compartida por los dos workspaces de este repo (apps/api, apps/web).
 * Deliberadamente NO importada desde ningún paquete común: ver
 * ARCHITECTURE.md, sección "Sin paquete de código compartido".
 */
export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // next-env.d.ts lo genera Next.js automáticamente y usa a propósito
    // una referencia triple-slash: es su convención, no código nuestro.
    ignores: ['**/dist/**', '**/.next/**', '**/node_modules/**', '**/next-env.d.ts'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
