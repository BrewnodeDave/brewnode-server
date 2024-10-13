'use strict';

var utils = require('../utils/writer.js');
var BrewfatherYeasts = require('../service/BrewfatherYeastsService');

module.exports.getYeast = function getYeast (req, res, next, id, include) {
  BrewfatherYeasts.getYeast(id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getYeasts = function getYeasts (req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  BrewfatherYeasts.getYeasts(include, complete, inventory_exists, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateYeast = function updateYeast (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherYeasts.updateYeast(id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
