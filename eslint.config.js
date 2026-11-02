import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import react from 'eslint-plugin-react'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // The build's own config files run in Node, not a browser, so they need Node's
  // globals — otherwise `module` reads as undefined and each one errors.
  //
  // They are split by module system because this project mixes the two. There is
  // no "type": "module" in package.json, so a bare .js is CommonJS to Node; that
  // is why postcss and tailwind use `module.exports`. Vite and ESLint, though,
  // load their own config through a transform and accept ESM regardless — so
  // those two are written with `import`. Linting either group under the other's
  // sourceType is a parse error.
  {
    files: ['postcss.config.js', 'tailwind.config.js'],
    languageOptions: { globals: globals.node, sourceType: 'commonjs' },
  },
  {
    files: ['vite.config.js', 'eslint.config.js'],
    languageOptions: { globals: globals.node, sourceType: 'module' },
  },

  {
    files: ['**/*.{js,jsx}'],
    ignores: ['*.config.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: { react },
    rules: {
      // Base ESLint does not know that <Icon /> is a use of `Icon`; that is what
      // this rule adds. Without it a component referenced only from JSX reads as
      // dead, which is why varsIgnorePattern below had to exempt every
      // capitalised name — a blunt workaround that also hid genuinely unused ones.
      'react/jsx-uses-vars': 'error',
      'react/jsx-uses-react': 'error',

      'no-unused-vars': ['error', {
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_',
        caughtErrors: 'none'
      }],
    },
  },
])
