'use strict'

/**
 * Main module of the Equabank-scraper library.
 */
const logger = require('./logger')
let log
module.exports = (opts = { debug: false }) => {
  if ( opts.debug ) {
    log = logger('debug')
    log.info('Equabank scraper initialised')
  }
  return module.exports  
}
log = logger()

const utils = require('./utils')
const parser = require('./parser')
const axios = require('axios')
const cheerio = require('cheerio')
const moment = require('moment')

// http client instance
const http = axios.create({
  baseURL: 'https://www.equabanking.cz/IBS/',
  timeout: 5000,
  headers: {
    Accept: 'text/html,application/xhtml+xml,application/xml',
    'Content-Type': 'application/x-www-form-urlencoded'
  }
})

/**
 * Function loads the login page of the internet banking, eneters login
 * credentials and send a request to the server.
 * @param {String} username Username for Equabanking
 * @param {String} password Password for Equabanking
 * @param {function} callback Callback function executed when login is finished
 * @returns {Promise} Object with basic info about accounts from the home page
 */
function login(username, password, callback) {
  let page
  log.info('Loading login page...')
    // load the login page
  const getLoginData = {
    javaVM: 7,
    command: 'auth_loginByPasswordPage',
    staticCmd: 'null'
  }
  return http.post('/ControllerServlet', utils.object2FormData(getLoginData))
    .then(response => {
      log.debug('Login page loaded.')
      if (response.status === 200) {
        return response.data
      }
      throw new Error('Error while loading login page')
    })
    .then(loginPage => {
      return utils.writeToFile('/tmp/login.html', loginPage)
    })
    // parse usefull data from the login page
    .then(loginPage => {
      const $ = cheerio.load(loginPage)
      if ($('body#login')) {
        return {
          loginAction: $('form#simpleForm').attr('action'),
          OTOKey: $('form#simpleForm input[name=OTOKey]').attr('value')
        }
      }
      throw new Error('Error while parsing login page.')
    })
    // perform the login request
    .then(loginData => {
      const loginFormData = {
        command: 'auth_loginByPassword',
        checkInputs: 'false',
        typeOfLogin: 'mk',
        username,
        password,
        suppModule: 'eTpkcs11',
        module: 'eTpkcs11',
        keyStoreType: 'eTpkcs11',
        protocol: 'pkcs11://',
        OTOKey: loginData.OTOKey,
        CurrentTime: new Date().getHours(),
        loginByMK_username: username,
        loginByMK_password: password
      }
      log.info('Performing login, loading home page ...')
      return http.post(`/${loginData.loginAction}`, utils.object2FormData(loginFormData))
      .then(response => {
        log.debug('Home page loaded')
        page = processPage(response.data)
      })
      .catch(err => {
        console.error(err)
        throw new Error('Error while loading main page')
      })
    })
    .then(() => {
      return utils.writeToFile('/tmp/home.html', page.raw)
    })
    // process the main page
    .then(() => {
      return parser.parseHomePage(page.parsed)
    })
    .then(data => {
      return {
        action: page.action,
        data
      }
    })
    .then(callback)
}
module.exports.login = login

/**
 * Function to get history of transactions.
 * @param {String} action Action string returned by login request or any previous callback
 * @param {Date} startDate Date of the oldest transaction
 * @param {Date} endDate Date of the newest transaction
 * @param {function} progress Callback indicating progress of the operation
 * @param {function} callback Callback fucntion executed when operation is finished
 * @returns {Promise} Object with transactions history
 */
function getTransactions(action, startDate = moment().subtract(3, 'days'), 
  endDate = moment(), progress, callback) {
  log.info('Getting transactions page')   

  if (moment(endDate).diff(moment(startDate)) < 0) {
    throw new Error('End date is newer that start date.')
  }

  let pageData

  // Load transaction history page
  return http.post(action, generateCommandString('mov_filterPage'))
    .then(response => {
      console.log('Transactions page loaded.')
      pageData = processPage(response.data)
    })
    .catch(err => {
      throw new Error('Error while loading transactions page', err)
    })
    .then(() => {
      return utils.writeToFile('/tmp/transactions.html', pageData.raw)
    })
    .then(() => {
      // set filter parameters and load first page with transactions
      const commandObject = {
        command: 'mov_filterVerify',
        verificationGroupName: 'transactionHistoryFilter',
        useGDMVerification: 'false',
        transactionsFilterStatus: 'open',
        accountNumber: 0,
        accountId: '',
        period: 'user',
        startDateRef: startDate.format('DD.MM.YYYY'),
        endDateRef: endDate.format('DD.MM.YYYY'),
        fromAmount: '',
        toAmount: '',
        creditAccountNumberFull: '%',
        creditAccountPrefix: '',
        creditAccountNumber: '',
        creditBankCode: '',
        variableSymbol: '',
        transactionType: 6,
        kategorie: ''
      }

      log.debug('Setting transactions filter', commandObject)
      return http.post(pageData.action, utils.object2FormData(commandObject))
    })
    .then(response => {
      console.log('Transactions page loaded.')
      pageData = processPage(response.data)
    })
    .catch(err => {
      throw new Error('Error while loading transactions page', err)
    })    
    .then(() => {
      return utils.writeToFile('/tmp/transactions-1.html', pageData.raw)
    })    
    .then(() => {
      const { transactions, pagination } = parser.parseTransactionsPage(pageData.parsed)
      if (pagination.currentPage < pagination.lastPage) {
        // let's add 1000ms delay between the requests
        return utils.delay(1000).then(() => {
          return getTransactionsNextPage(pageData.action, pagination.nextPage, transactions)       
        })
      }
      return { action: pageData.action, transactions }
    })
    .then(callback)
}
module.exports.getTransactions = getTransactions

function getTransactionsNextPage(action, page, allTransactions) {
  log.info('Getting transactions page', page)
  let pageData
  return http.post(action, utils.object2FormData({ command: 'mov_listGoToPage', custom1: page}))
    .then(response => {
      log.debug('Transaction page loaded')
      pageData = processPage(response.data)
    })
    .catch(err => {
      throw new Error('Error while loading transactions page', err)
    })
    .then(() => {
      return utils.writeToFile(`/tmp/transactions-${page}.html`, pageData.raw)
    })      
    .then(() => {
      const { pageTransactions, pagination } = parser.parseTransactionsPage(pageData.parsed)
      allTransactions.push(pageTransactions)
      if (pagination.currentPage < pagination.lastPage) {
        return utils.delay(1000).then(() => {
          return getTransactionsNextPage(pageData.action, pagination.nextPage, allTransactions)
        })        
      }
      return { action: pageData.action, transactions: allTransactions }
    })    

}

/**
 * Construct string that is posted to the IBS ControllerServlet describing
 * the action should be performed.
 * @param {String} command  Command string for performed action
 * @returns {String} string for ControllerServlet
 */
function generateCommandString(command) {
  const commandObject = {
    command,
    custom1: 0,
    custom2: 0,
    custom3: 0,
    custom4: 0,
    custom5: 0,
    operID: '',
    filterString: '',
    verificationGroupName: '',
    requiredList: '',
    removeCommand: ''
  }
  return utils.object2FormData(commandObject)
}

/**
 * Process the page.
 * Take the raw reponse from the server and proces it to the object we can 
 * continue to work with.
 * @param {String} data Response body from the server
 * @returns {Object} unified page object
 */
function processPage(data) {
  data = data.replace(' <- ', ' &lt;- ').replace(' -> ', ' -&gt; ')
  const $ = cheerio.load(data)
  const action = parser.parseAction($)
  return {
    parsed: $,
    action,
    raw: data
  }
}
