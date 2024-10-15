/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

var utils = require('../utils/writer.js');
var BrewfatherFermentables = require('../service/brewfather-fermentables');

module.exports.getFermentables = function getHops (req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherFermentables.getFermentables(req, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getFermentable = function getFermentable (req, res, next, id, include) {
  BrewfatherFermentables.getFermentable(req, id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateFermentable = function updateFermentable (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherFermentables.updateFermentable(req, id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
