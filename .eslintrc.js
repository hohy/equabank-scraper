'use strict'

module.exports = {
  extends: [
    // Include configuration for working with Node.js source code
    '@strv/javascript/environments/nodejs/v6',
    '@strv/javascript/environments/nodejs/optional',
    '@strv/javascript/environments/nodejs/recommended',
  ],
  rules: {
    'newline-after-var': 0,
    'id-length': 0,
    'arrow-body-style': 0,
    'no-console': 0
  }
}
