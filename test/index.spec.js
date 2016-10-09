'use strict'

const expect = require('chai').expect
const EquabankScraper = require('../index')

describe('Lets do some basic testing', () => {

  it('Should create a new instance of the scraper', () => {
    const equabank = new EquabankScraper()
    expect(equabank).not.to.be.equal(null)
  })

  it('Should log in and return accounts data',
    function test(done) {
      this.timeout(10000)
      const equabank = new EquabankScraper()
      return equabank.login(process.env.EQUA_USERNAME, process.env.EQUA_PASSWORD)
        .then(results => {
          console.log(JSON.stringify(results))
          done()
        }).catch(err => {
          console.error(err)
        })
    })

})
