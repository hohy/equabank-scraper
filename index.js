'use strict'

/**
 * Main module of the Equabank-scraper library.
 */

class EquabankScraper {

  /**
   * Function loads the login page of the internet banking, eneters login
   * credentials and send a request to the server.
   * @param {String} username Username for Equabanking
   * @param {String} password Password for Equabanking
   * @param {function} callback Callback function executed when login is finished
   * @returns {Object} Object with basic info about accounts from the home page
   */
  login(username, password, callback) {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve('Hello EquaBank')
      }, 1000)
    }).then(callback)
  }

}

module.exports = EquabankScraper
