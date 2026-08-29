import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // These overrides must stay after the `flat/typescript` and
      // `flat/javascript` presets: in flat config the last matching entry wins,
      // so anything set before them gets re-enabled by the preset.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Newly enabled by the typescript-eslint v8 recommended set; it was not
      // enforced before the ESLint v9 upgrade. The codebase deliberately uses
      // the short-circuit form (`cond && doSomething()`) as an expression
      // statement, so the rule is turned off rather than rewriting that idiom.
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
];
