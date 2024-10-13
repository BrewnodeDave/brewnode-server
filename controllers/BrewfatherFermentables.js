'use strict';

var utils = require('../utils/writer.js');
var BrewfatherFermentables = require('../service/BrewfatherFermentablesService');

module.exports.getFermentable = function getFermentable (req, res, next, id, include) {
  BrewfatherFermentables.getFermentable(id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateFermentable = function updateFermentable (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherFermentables.updateFermentable(id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
