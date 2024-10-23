/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const { get } = require('./common.js');

async function getRecipe (req, res, next, include, id) {
  const params = {include};
  const response = await get(req, `recipes/${id}`, params);
  res.status(response.status);
  res.send(response.data);
};

async function getRecipes (req, res, next, include, complete, limit, start_after, order_by, order_by_direction) {
  const params = {include,complete,limit,start_after,order_by,order_by_direction};
  const response = await get(req, `recipes`, params);res.status(response.status);
  res.status(response.status);
  res.send(response.data);
};

module.exports = {
  getRecipe,
  getRecipes
};
