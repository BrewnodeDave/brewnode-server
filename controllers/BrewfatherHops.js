/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

var utils = require('../utils/writer.js');
var BrewfatherHops = require('../service/brewfather-hops');

module.exports.getHops = function getHops (req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherHops.getHops(req, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHop = function getHop (req, res, next, id, include) {
  BrewfatherHops.getHop(req, id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateHop = function updateHop (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherHops.updateHop(req, id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
