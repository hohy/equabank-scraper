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
  let action
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
        if (response.status === 200) {
          const $ = cheerio.load(response.data)
          action = parser.parseAction($)
          return response.data
        }
        throw new Error('Error while loading main page')
      })
    })
    .then(homePage => {
      return utils.writeToFile('/tmp/home.html', homePage)
    })
    // process the main page
    .then(parser.parseHomePage)
    .then(data => {
      return {
        action,
        data
      }
    })
    .then(callback)
}
module.exports.login = login
