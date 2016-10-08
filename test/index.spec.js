'use strict'
const expect = require('chai').expect
const EquabankScraper = require('../index')

describe('Lets do some basic testing', () => {

  it('Should create a new instance of the scraper', () => {
    const equabank = new EquabankScraper()
    expect(equabank).not.to.be.equal(null)
  })
})
