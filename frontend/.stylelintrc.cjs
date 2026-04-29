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
    'scss/at-rule-no-unknown': true,
    'at-rule-no-unknown': null,
    'declaration-block-no-redundant-longhand-properties': null
  },
  ignoreFiles: ['dist/**', 'coverage/**', 'node_modules/**']
}
