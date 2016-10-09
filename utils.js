'use strict'

const fs = require('fs')

/**
 * Module with support functions.
 */

/**
 * Converts simple javascript object into Form data String
 * which can be sent to the server with application/x-www-form-urlencoded
 * content type
 * @param {Object} data Input form data
 * @returns {String} input object converted to the string
 */
module.exports.object2FormData = data => {
  const str = []
  for (const p in data) {
    if (data.hasOwnProperty(p) && data[p]) {
      str.push(`${encodeURIComponent(p)}=${encodeURIComponent(data[p])}`)
    }
  }
  return str.join('&')
}

module.exports.writeToFile = (fileName, data) => {
  return new Promise((resolve, reject) => {
    fs.writeFile(fileName, data, err => {
      if (err) {
        console.error(`Can't write into file ${fileName}!`)
        reject(err)
      } else {
        resolve(data)
      }
    })
  })
}
