'use strict'
const log = require('./logger')()
const moment = require('moment')

/**
 * Parse action URL with the session id from the page.
 * @param {Object} $ HTML document parsed by cheerio
 * @returns {String} action URL session id that can be used for following request
 */
function parseAction($) {
  return $('form#PostLink').attr('action')
}
module.exports.parseAction = parseAction

/**
 * Parses information from the home page.
 * @param {Object} $ HTML document loaded by cheerio
 * @return {Object} information about accounts and last transactions
 */
function parseHomePage($) {
  log.debug('Parsing home page')

  // Check if we have the correct page
  if ($('body#homepage')) {
    // get list of accounts
    const accounts = []
    const accountElements = $('table#currentAccountsTableId tr').next()
    accountElements.each((index, account) => {
      account = $(account)
      const id = account.find('td.account span').text()
      const name = account.find('td.account a').text()
      const balance = parseBalance(account.find('td.total').text())
      accounts.push({ id, name, balance: balance.balance, currency: balance.currency })
    })

    log.info('Parsed accounts', accounts)
    return { accounts }
  }
  throw new Error('Error while paring home page')
}

module.exports.parseHomePage = parseHomePage

function parseTransactionsPage($) {
  log.debug('Parsing transaction history page')

  // parse all the transactions on the page
  const transactions = []
  const transactionElements = $('table#transaction-history tr').next()
  transactionElements.each((index, transaction) => {
    transaction = $(transaction)
    const date = moment(transaction.find('td.highlight strong').text(), 'DD.MM.YYYY').toDate()
    const type = transaction.find('td a strong').text()
    const fromToString = transaction.find('td span.small').text()
    const direction = transaction.attr('class')
    let from, to
    if (direction === 'outgoing') {
      from = fromToString.split('->')[0].trim()
      to = fromToString.split('->')[1].trim()
    } else {
      from = fromToString.split('<-')[1].trim()
      to = fromToString.split('<-')[0].trim()    
    }
    const amount = parseBalance(transaction.find('td.amount').text())
    transactions.push({ date, type, direction, from, to, amount })
  })

  // parse pagination
  const pages = []
  $('div.pagination li').each((index, page) => parseInt(pages.push($(page).text())))
  
  const currentPage = parseInt($('div.pagination li.current').text())
  
  let lastPage = currentPage
  const lastPageElement = $('div.pagination a.button:contains("poslední")')
  if (lastPageElement.length) {
    lastPage = parseInt(lastPageElement.attr('href').match(/\d+/g)[0])
  }
  
  let prevPage = null
  const prevPageElement = $('div.pagination a.button.prev')
  if (prevPageElement.length > 0) {
    prevPage = parseInt(prevPageElement.attr('href').match(/\d+/g)[0])
  }
  
  let nextPage = null
  const nextPageElement = $('div.pagination a.button.next')
  if (nextPageElement.length) {
    nextPage = parseInt(nextPageElement.attr('href').match(/\d+/g)[0])
  }

  log.info('Parsed transactions', transactions)
  return {
    transactions,
    pagination: {
      pages,
      currentPage,
      prevPage,
      nextPage,
      lastPage
    }
  }
}

module.exports.parseTransactionsPage = parseTransactionsPage

/**
 * Parses strings used in EquaBanking to represent account balance into JS types.
 * Examples: "123,22 CZK" => { balance: 123.22, currency: "CZK" }
 * @param {String} balanceString Balance string to be parsed.
 */
function parseBalance(balanceString) {
  balanceString = balanceString.replace(/\s/g, '')
  const balance = parseFloat(balanceString.slice(0, -3).replace(',', '.'))
  const currency = balanceString.slice(-3)

  return { balance, currency }
}
