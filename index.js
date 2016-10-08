'use strict'
/**
 * Main module of the Equabank-scraper library.
 */

class EquabankScraper {

  /**
   * Function loads the login page of the internet banking, eneters login
   * credentials and send a request to the server.
   * @param {String} username
   * @param {String} password
   */
  login(username, password, callback) {
    return new Promise((resove, reject) => {
      setTimeout(() => {
        resolve("Hello EquaBank")
      }, 1000)
    }).then(callback)
  }

}

module.exports = EquabankScraper
