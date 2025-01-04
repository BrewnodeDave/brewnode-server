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
  try {
    const response = await get(req, `recipes/${id}`, params);
    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 0;
      res.status(429).send(`Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
      res.status(error.response ? error.response.status : 500).send(error.message);
    }
  }
};

async function getRecipes (req, res, next, include, complete, limit, start_after, order_by, order_by_direction) {
  const params = {include,complete,limit,start_after,order_by,order_by_direction};
  try {
    const response = await get(req, `recipes`, params);res.status(response.status);
    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 0;
      res.status(429).send(`Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
      res.status(error.response ? error.response.status : 500).send(error.message);
    }
  }
};

module.exports = {
  getRecipe,
  getRecipes
};
