/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

async function getHops(req, res, next, include, complete, inventory_exists, limit, start_after, order_by, order_by_direction) {
  const params = {include,complete,inventory_exists,limit,start_after,order_by,order_by_direction};
  const response = await get(req, `inventory/hops`, params);
  res.status(response.status).send(response.data);
};

async function getHop (req, res, next, id, include) {
  const params = {include};
  const response = await get(req, `inventory/hops/${id}`, params);
  res.status(response.status).send(response.data);
};

async function updateHop (req, res, next, id, inventory_adjust, inventory) {
  const params = {inventory_adjust, inventory, id};
  const response = await patch(req, `inventory/hops/${id}`, params);
  res.status(response.status).send(response.data);
};

module.exports = { 
  getHop,
  getHops,
  updateHop
};
