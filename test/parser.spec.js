'use strict'

const rewire = require('rewire')
const parser = rewire('../parser')
const fs = require('fs')
const cheerio = require('cheerio')
const expect = require('chai').expect

describe('Parser tests', () => {
  it('Should parse the home page', done => {
    const homePage = fs.readFileSync('./test/resources/home.html')
    const $ = cheerio.load(homePage)
    const result = parser.parseHomePage($)
    expect(result.accounts[0].id).to.be.eql('1111111111/1111')
    expect(result.accounts[0].name).to.be.eql('Běžný účet')
    expect(result.accounts[0].balance).to.be.eql(12345.67)
    expect(result.accounts[0].currency).to.be.eql('CZK')
    done()
  })

  it('Should parse all variants of the balance string', () => {
    const parseBalance = parser.__get__('parseBalance')
    expect(parseBalance('123 CZK')).to.eql({ balance: 123, currency: 'CZK' })
    expect(parseBalance('12 345 CZK')).to.eql({ balance: 12345, currency: 'CZK' })
    expect(parseBalance('12 345,67 CZK')).to.eql({ balance: 12345.67, currency: 'CZK' })
  })
})
