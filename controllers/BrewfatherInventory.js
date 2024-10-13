'use strict';

var utils = require('../utils/writer.js');
var BrewfatherInventory = require('../service/BrewfatherInventoryService');

module.exports.getFermentables = function getFermentables (req, res, next, inventory_negative, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherInventory.getFermentables(inventory_negative, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getHops = function getHops (req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherInventory.getHops(include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getMiscs = function getMiscs (req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherInventory.getMiscs(include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
