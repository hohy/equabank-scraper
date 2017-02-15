'use strict'

const rewire = require('rewire')
const parser = rewire('../parser')
const app = rewire('../index')
const fs = require('fs')
const cheerio = require('cheerio')
const expect = require('chai').expect

const processPage = app.__get__('processPage')

describe('Parser tests', () => {
  it('Should parse the home page', done => {
    const homePage = fs.readFileSync('./test/resources/home.html')
    const $ = cheerio.load(homePage)
    const result = parser.parseHomePage($)
    expect(result.accounts[0].id).to.be.eql('1031483452/6100')
    expect(result.accounts[0].name).to.be.eql('Běžný účet')
    expect(result.accounts[0].balance).to.be.eql(88666.11)
    expect(result.accounts[0].currency).to.be.eql('CZK')
    done()
  })

  it('Should parse all variants of the balance string', () => {
    const parseBalance = parser.__get__('parseBalance')
    expect(parseBalance('123 CZK')).to.eql({ balance: 123, currency: 'CZK' })
    expect(parseBalance('12 345 CZK')).to.eql({ balance: 12345, currency: 'CZK' })
    expect(parseBalance('12 345,67 CZK')).to.eql({ balance: 12345.67, currency: 'CZK' })
  })

  describe('Transactions history page parsing', () => {

    let transactions = []

    it('Should load and parse the transaction history page', done => {
      const transactionsPage = fs.readFileSync('./test/resources/transactions.html').toString()
      
      const $ = processPage(transactionsPage).parsed
      const result = parser.parseTransactionsPage($)
      expect(result.transactions).to.be.an('array')
      expect(result.transactions.length).to.eql(5)
      console.log(result.transactions)
      transactions = result.transactions      
      done()
    })

    it('Should parse outgoing transaction', () => {
      const t = transactions[0]
      expect(t.direction).to.eql('outgoing')
      expect(t.date).to.eql(new Date('2017-01-16T23:00:00.000Z'))
      expect(t.type).to.eql('Platba kartou')
      expect(t.from).to.eql('Běžný účet')
      expect(t.to).to.eql('ONE CAFE, PRAHA 8')
      expect(t.amount.balance).to.eql(-150)
      expect(t.amount.currency).to.eql('CZK')
    })

    it('Should parse incoming transaction', () => {
      const t = transactions[3]
      expect(t.direction).to.eql('incoming')
      expect(t.date).to.eql(new Date('2017-01-14T23:00:00.000Z'))
      expect(t.type).to.eql('Příchozí platba v rámci Equa bank')
      expect(t.from).to.eql('Běžný účet')
      expect(t.to).to.eql('Spořící účet EXTRA')
      expect(t.amount.balance).to.eql(80000)
      expect(t.amount.currency).to.eql('CZK')
    }) 

    describe('Pagination parsing', () => {
      it('Should parse the first page of many pages', () => {
        const transactionsPage = fs.readFileSync('./test/resources/pagination/first.html').toString()
        const $ = processPage(transactionsPage).parsed
        const { pagination } = parser.parseTransactionsPage($)

        expect(pagination).to.be.an('object')
        expect(pagination.pages).to.be.an('array')
        expect(pagination.pages.length).to.eql(3)
        expect(pagination.currentPage).to.eql(1)
        expect(pagination.prevPage).to.eql(null)        
        expect(pagination.nextPage).to.eql(2)
        expect(pagination.lastPage).to.eql(3)
      })   

      it('Should parse a middle page of many pages', () => {
        const transactionsPage = fs.readFileSync('./test/resources/pagination/middle.html').toString()
        const $ = processPage(transactionsPage).parsed
        const { pagination } = parser.parseTransactionsPage($)
        
        expect(pagination).to.be.an('object')
        expect(pagination.pages).to.be.an('array')
        expect(pagination.pages.length).to.eql(3)
        expect(pagination.currentPage).to.eql(2)
        expect(pagination.prevPage).to.eql(1)
        expect(pagination.nextPage).to.eql(3)
        expect(pagination.lastPage).to.eql(3)
      })   

      it('Should parse the last page of many pages', () => {
        const transactionsPage = fs.readFileSync('./test/resources/pagination/last.html').toString()
        const $ = processPage(transactionsPage).parsed
        const { pagination } = parser.parseTransactionsPage($)

        expect(pagination).to.be.an('object')
        expect(pagination.pages).to.be.an('array')
        expect(pagination.pages.length).to.eql(3)
        expect(pagination.currentPage).to.eql(3)
        expect(pagination.prevPage).to.eql(2)        
        expect(pagination.nextPage).to.eql(null)
        expect(pagination.lastPage).to.eql(3)
      })   

    })
  })

})
