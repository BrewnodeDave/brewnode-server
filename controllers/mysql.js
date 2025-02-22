/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';
const mysqlService = require('../src/services/mysql-service.js');

async function mysqlBrewnames (req, res, next) {
  try {
    const brewnames = await mysqlService.mysqlBrewnames();
    res.status(200).send(brewnames);
  } catch (error) {
    res.status(500).send(error);
  }
}

module.exports = {
  mysqlBrewnames
}
