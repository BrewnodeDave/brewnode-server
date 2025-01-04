/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const {get, patch} = require('./common.js');

async function getFermentables (req, res, next, inventory_negative, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  const params = {inventory_negative,include,complete,inventory_exists,limit,start_after,order_by,order_by_direction};
  try {
    const response = await get(req, `inventory/fermentables`, params);
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

async function getFermentable  (req, res, next, include, id) {
  const params = {include};
  try {
    const response = await get(req, `inventory/fermentables/${id}`, params);
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

/**
 * Updates a fermentable inventory item.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {number} inventory_adjust - The adjustment to be made to the inventory.
 * @param {number} inventory - The current inventory level.
 * @param {string} id - The ID of the fermentable item to update.
 * @returns {Promise<void>} - A promise that resolves when the update is complete.
 */
async function updateFermentable  (req, res, next, inventory_adjust, inventory, id) {
  const params = {inventory_adjust, inventory, id};
  try {
    const response = await patch(req, `inventory/fermentables/${id}`, params);
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
  getFermentable,
  getFermentables,
  updateFermentable
};