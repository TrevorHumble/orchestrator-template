// ESLint flat config (ESLint 10). Lints server JS (CommonJS), browser JS, and
// tests. Prettier owns formatting; eslint-config-prettier disables stylistic
// rules here.
const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'data/**', 'coverage/**', '**/*.min.js'],
  },
  js.configs.recommended,
  {
    // Server code + root config files: Node CommonJS. FILL: src/**/*.js,
    // scripts/**/*.js, and config.js describe a consumer's future tree --
    // this template ships none of them yet. Keep the globs anyway: without
    // them a consumer's first source file would be matched only by
    // js.configs.recommended above, which knows nothing of Node's
    // require/module globals and would fire no-undef on every one of them.
    files: ['src/**/*.js', 'scripts/**/*.js', 'config.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
  {
    // Browser code, for a consumer that ships any (src/public/js/**).
    files: ['src/public/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: { ...globals.browser },
    },
    rules: {
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Tests: Vitest globals (globals: true in vitest.config.mjs).
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
      },
    },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module', globals: { ...globals.node } },
  },
  prettier,
];
