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
  const response = await get(req, `inventory/fermentables`, params);
  res.status(response.status);
  res.send(response.data);
};

async function getFermentable  (req, res, next, include, id) {
  const params = {include};
  const response = await get(req, `inventory/fermentables/${id}`, params);
  res.status(response.status);
  res.send(response.data);
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
  const response = await patch(req, `inventory/fermentables/${id}`, params);
  res.status(response.status);
  res.send(response.data);
};

module.exports = { 
  getFermentable,
  getFermentables,
  updateFermentable
};