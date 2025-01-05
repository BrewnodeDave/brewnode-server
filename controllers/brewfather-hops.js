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
  try {
    const response = await get(req, `inventory/hops`, params);
    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 0;
      res.send(429, `Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
      res.status(error.response ? error.response.status : 500).send(error.message);
    }
  }
};

async function getHop (req, res, next, id, include) {
  const params = {include};
  try {
    const response = await get(req, `inventory/hops/${id}`, params);
    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 0;
      res.send(429, `Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
      res.status(error.response ? error.response.status : 500).send(error.message);
    }
  }
};

async function updateHop (req, res, next, id, inventory_adjust, inventory) {
  const params = {inventory_adjust, inventory, id};
  try {
    const response = await patch(req, `inventory/hops/${id}`, params);
    res.status(response.status).send(response.data);
  } catch (error) {
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 0;
      res.send(429, `Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
      res.status(error.response ? error.response.status : 500).send(error.message);
    }
  }
};

module.exports = { 
  getHop,
  getHops,
  updateHop
};
