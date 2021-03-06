'use strict'

const expect = require('chai').expect
const equabank = require('../index')({ debug: true })
const fs = require('fs')
const moment = require('moment')

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
})


describe('Transactions history page tests', () => {
  it('Should load the transaction history page', function test() {
    this.timeout(10000)
    return equabank.login(process.env.EQUA_USERNAME, process.env.EQUA_PASSWORD).then(login => {
      return equabank.getTransactions(login.action).then(results => {
        expect(results.action).to.be.a('string')
        expect(results.transactions).to.be.an('array')
        console.log(results.transactions)
      })
    })
  })

  it('Test date parameters', function test() {
    this.timeout(15000)
    return equabank.login(process.env.EQUA_USERNAME, process.env.EQUA_PASSWORD).then(login => {
      return equabank.getTransactions(login.action, moment('01.01.2016', 'DD.MM.YYYY'),
          moment('31.01.2016', 'DD.MM.YYYY'))
        .then(results => {
          expect(results.action).to.be.a('string')
          expect(results.transactions).to.be.an('array')
          console.log(results.transactions)
        })
    })
  })  
})
