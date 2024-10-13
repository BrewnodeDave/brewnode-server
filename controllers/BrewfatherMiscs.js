'use strict';

var utils = require('../utils/writer.js');
var BrewfatherMiscs = require('../service/BrewfatherMiscsService');

module.exports.getMisc = function getMisc (req, res, next, id, include) {
  BrewfatherMiscs.getMisc(id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateMisc = function updateMisc (req, res, next, id, inventory_adjust, inventory) {
  BrewfatherMiscs.updateMisc(id, inventory_adjust, inventory)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
