// Minimal ESLint flat config.
//
// Scope is intentionally narrow: only high-signal correctness rules that need no
// knowledge of the runtime globals. Style rules and no-undef/no-unused-vars are left
// off for now — turning them on across ~400k lines would be pure noise rather than a
// gate.
//
// A handful of rules already fire on pre-existing code (mostly deliberate test
// fixtures and two production spots). They are set to `warn` so the gate stays green
// without re-touching the existing tree; move them back to `error` once those hits are
// triaged. New files are therefore still checked, and CI fails on any real error.
//
// ponytail: no @eslint/js preset and no `globals` package yet. Upgrade path: adopt
// `@eslint/js` recommended + `globals` per directory (browser / node / electron) once
// the repo can pass them.
const preExistingWarnings = {
  'no-regex-spaces': 'warn',
  'no-empty-pattern': 'warn',
  'no-dupe-keys': 'warn',
  'no-misleading-character-class': 'warn',
  'no-cond-assign': 'warn',
  'no-unreachable': 'warn',
  'no-compare-neg-zero': 'warn',
  'no-template-curly-in-string': 'warn',
};

const correctnessRules = {
  'no-dupe-args': 'error',
  'no-dupe-class-members': 'error',
  'no-dupe-else-if': 'error',
  'no-unsafe-negation': 'error',
  'no-obj-calls': 'error',
  'no-constant-condition': ['error', { checkLoops: false }],
  'valid-typeof': 'error',
  'no-self-assign': 'error',
  'no-func-assign': 'error',
  'no-import-assign': 'error',
  'no-this-before-super': 'error',
  'no-sparse-arrays': 'error',
  'getter-return': 'error',
  'no-async-promise-executor': 'error',
  'no-fallthrough': 'error',
  'use-isnan': 'error',
  'no-useless-backreference': 'error',
  ...preExistingWarnings,
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      'vendor/**',
      'test-artifacts/**',
      'dist-win/**',
      'dist/**',
      'build/**',
      '.electron-runtime/**',
      'playwright-report/**',
      'test-results/**',
      'coverage/**',
      'deobf-tools/**',
      '.kilo/**',
      'user/**',
      'data/**',
      'output/**',
      'images/**',
      'assets/**',
      'native/**',
    ],
  },
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: correctnessRules,
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'commonjs' },
    rules: correctnessRules,
  },
];
