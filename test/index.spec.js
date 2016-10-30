'use strict'

const expect = require('chai').expect
const equabank = require('../index')
const fs = require('fs')

describe('Lets do some basic testing', () => {
  it('Should log in and return accounts data',
    function test() {
      this.timeout(10000)
      return equabank.login(process.env.EQUA_USERNAME, process.env.EQUA_PASSWORD)
        .then(results => {
          console.log(JSON.stringify(results))
        }).catch(err => {
          console.error(err)
        })
    })

  it('Should parse the home page', done => {
    const homePage = fs.readFileSync('./resources/home.html')
    const result = equabank.parseHomePage(homePage)
    console.log(JSON.stringify(result))
    done()
  })
})
