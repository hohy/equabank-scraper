'use strict'
const pino = require('pino')

const pretty = pino.pretty()
pretty.pipe(process.stdout)

let logger = pino({ level: 'silent' }, pretty)

module.exports = function init(level) {
  if (level) {
    logger = pino({ level }, pretty)
  }

  return logger
}