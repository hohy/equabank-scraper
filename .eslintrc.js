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
  ]
}