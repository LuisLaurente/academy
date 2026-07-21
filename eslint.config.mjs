import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypeScript from 'eslint-config-next/typescript';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/dist/**',
      '**/node_modules/**',
      'apps/api/src/generated/prisma/**',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}', 'packages/ui/**/*.{ts,tsx}'],
    extends: [...nextVitals, ...nextTypeScript],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ['packages/ui/**/*.{ts,tsx}'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  prettier,
);
