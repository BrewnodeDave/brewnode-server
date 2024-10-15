/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

var utils = require('../utils/writer.js');
var BrewfatherRecipes = require('../service/brewfather-recipes');

module.exports.getRecipe = function getRecipe (req, res, next, id, include) {
  BrewfatherRecipes.getRecipe(req, id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getRecipes = function getRecipes (req, res, next, include, complete, limit, start_after, order_by, order_by_direction) {
  BrewfatherRecipes.getRecipes(req, include, complete, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
