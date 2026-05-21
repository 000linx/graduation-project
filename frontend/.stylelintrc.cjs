module.exports = {
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-scss'],
  overrides: [
    {
      files: ['**/*.vue'],
      customSyntax: 'postcss-html'
    }
  ],
  rules: {
    'no-empty-source': null,
    'selector-class-pattern': null,
    'scss/at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: ['tailwind', 'apply', 'layer', 'config', 'variants', 'responsive', 'screen']
      }
    ],
    'at-rule-no-unknown': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['deep', 'global', 'slotted']
      }
    ],
    'keyframes-name-pattern': [
      '^[a-z][a-zA-Z0-9]+$',
      {
        message: 'Expected keyframe name to be lowerCamelCase'
      }
    ]
  },
  ignoreFiles: ['dist/**', 'coverage/**', 'node_modules/**']
}
