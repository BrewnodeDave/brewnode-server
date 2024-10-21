/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const {get} = require('./common.js');

/**
 * Retrieves yeast data from BrewfatherYeasts and sends the response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {boolean} include - Whether to include additional data.
 * @param {boolean} complete - Whether to include complete data.
 * @param {boolean} inventory_exists - Whether to check if inventory exists.
 * @param {number} limit - The limit for the number of records to retrieve.
 * @param {string} start_after - The starting point for pagination.
 * @param {string} order_by - The field to order the results by.
 * @param {string} order_by_direction - The direction to order the results (asc/desc).
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function getYeasts(req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  const params = {include,complete,inventory_exists,limit,start_after,order_by,order_by_direction};
  const response = await get(req, `inventory/yeasts`, params);
  res.status(response.status);
  res.send(response.data);
};


/**
 * Retrieves yeast data from BrewfatherYeasts and sends the response.
 *
 * @async
 * @function getYeast
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {boolean} include - Flag to include additional data.
 * @param {string} id - The ID of the yeast to retrieve.
 * @returns {Promise<void>} - A promise that resolves when the response is sent.
 */
async function getYeast (req, res, next, include, id) {
  const params = {include};
  const response = await get(req, `inventory/yeasts/${id}`, params);
  res.status(response.status);
  res.send(response.data);
};


/**
 * Updates yeast information in the BrewfatherYeasts database.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} id - The ID of the yeast to update.
 * @param {number} inventory_adjust - The amount to adjust the inventory by.
 * @param {number} inventory - The new inventory amount.
 * @returns {Promise<void>} - A promise that resolves when the yeast has been updated.
 */
async function updateYeast (req, res, next, inventory_adjust, inventory, id) {
  const params = {inventory_adjust, inventory, id};
  const response = await patch(req, `inventory/yeasts/${id}`, params);res.status(response.status);
  res.status(response.status);
  res.send(response.data);
};

module.exports = {
  getYeast,
  getYeasts,
  updateYeast
}