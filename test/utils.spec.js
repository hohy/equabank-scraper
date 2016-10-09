'use strict'

const expect = require('chai').expect
const utils = require('../utils')

describe('Utils tests', () => {

  it('object2FormData test', () => {
    const form = utils.object2FormData({ test: 'hello', foo: 'bar' })
    expect(form).to.be.equal('test=hello&foo=bar')
  })

})
