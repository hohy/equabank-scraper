'use strict'

module.exports = {
  extends: [
    // Include configuration for working with Node.js source code
    '@strv/javascript/environments/nodejs/v6',
    '@strv/javascript/environments/nodejs/best-practices',
    '@strv/javascript/environments/nodejs/optional',
    // Include coding style configuration. This does not depend on
    // any of the above and should be included last.
    '@strv/javascript/coding-styles/base'
  ],
  rules: {
    'newline-after-var': 0,
    'id-length': 0,
    'arrow-body-style': 0,
    'no-console': 0
  }
}
