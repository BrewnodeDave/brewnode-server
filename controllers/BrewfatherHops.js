'use strict';

var utils = require('../utils/writer.js');
var BrewfatherHops = require('../service/BrewfatherHopsService');

module.exports.getHop = function getHop (req, res, next, id, include) {
  BrewfatherHops.getHop(id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateHop = function updateHop (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherHops.updateHop(id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
