import { defineConfig, globalIgnores } from 'eslint/config'
import eslint from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import typescriptEslintEslintPlugin from '@typescript-eslint/eslint-plugin'
import stylistic from '@stylistic/eslint-plugin'

export default defineConfig([
  globalIgnores(['node_modules/*', 'lib/*', 'coverage/*']),
  { files: ['**/*.{js,mjs,cjs,ts}'], languageOptions: { globals: globals.node } },
  tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    stylistic.configs.recommended,
    {
      files: ['**/*.ts'],
      plugins: { '@typescript-eslint': typescriptEslintEslintPlugin },
      rules: {
        '@stylistic/indent': [
          'error', 4,
        ],
        '@stylistic/quotes': [
          'error', 'double',
        ],
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            args: 'all',
            argsIgnorePattern: '^_',
            caughtErrors: 'all',
            caughtErrorsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            ignoreRestSiblings: true,
          },
        ],
      },
    },
  ),

])
