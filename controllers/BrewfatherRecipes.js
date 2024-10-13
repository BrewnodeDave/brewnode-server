'use strict';

var utils = require('../utils/writer.js');
var BrewfatherRecipes = require('../service/BrewfatherRecipesService');

module.exports.getRecipe = function getRecipe (req, res, next, id, include) {
  BrewfatherRecipes.getRecipe(id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRecipes = function getRecipes (req, res, next, include, complete, limit, start_after, order_by, order_by_direction) {
  BrewfatherRecipes.getRecipes(include, complete, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
