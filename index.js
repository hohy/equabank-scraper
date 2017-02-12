'use strict'

const utils = require('./utils')
const parser = require('./parser')
const axios = require('axios')
const cheerio = require('cheerio')

/**
 * Main module of the Equabank-scraper library.
 */

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
  console.log('Loading login page...')
    // load the login page
  const getLoginData = {
    javaVM: 7,
    command: 'auth_loginByPasswordPage',
    staticCmd: 'null'
  }
  return http.post('/ControllerServlet', utils.object2FormData(getLoginData))
    .then(response => {
      console.log('Login page loaded.')
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
      console.log('Performing login, loading home page ...')
      return http.post(`/${loginData.loginAction}`, utils.object2FormData(loginFormData))
      .then(response => {
        console.log('Home page loaded')
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

function getTransactions(action, callback) {
  let page
  return http.post(action, generateCommandString('mov_filterPage'))
    .then(response => {
      console.log('Transactions page loaded.')
      page = processPage(response.data)
    })
    .catch(err => {
      throw new Error('Error while loading login page', err)
    })
    .then(() => {
      return utils.writeToFile('/tmp/transactions.html', page.raw)
    })
  .then(callback)
}
module.exports.getTransactions = getTransactions

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
