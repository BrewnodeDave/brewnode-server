/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

var utils = require('../utils/writer.js');
var BrewfatherMiscs = require('../service/brewfather-miscs');

module.exports.getMiscs = function getMiscs (req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherMiscs.getMiscs(req, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMisc = function getMisc (req, res, next, id, include) {
  BrewfatherMiscs.getMisc(req, id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateMisc = function updateMisc (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherMiscs.updateMisc(req, id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
