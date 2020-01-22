// http://eslint.org/docs/user-guide/configuring

module.exports = {
  root: true,
  parserOptions: {
    parser: 'babel-eslint',
    sourceType: 'module'
  },
  env: {
    browser: true,
  },
  globals: {
    describe: true,
    context: true,
    expect: true,
    beforeEach: true,
    it: true,
    Cypress: true,
    cy: true,
    api: true,
    '_': true,
    moment: true,
    ws: true
  },
  // https://github.com/feross/standard/blob/master/RULES.md#javascript-standard-style
  extends: ['plugin:vue/recommended', 'standard'],
  // required to lint *.vue files
  // add your custom rules here
  'rules': {
    // disable this one
    'vue/max-attributes-per-line': 0,
    // allow paren-less arrow functions
    'arrow-parens': 0,
    // allow async-await
    'generator-star-spacing': 0,
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
    'vue/attributes-order': 0,
    'eol-last': 0
  }
}
