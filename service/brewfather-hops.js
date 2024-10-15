/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';
const {get, patch} = require('./common.js');

exports.getHops = async (req, include,complete,inventory_exists,limit,start_after,order_by,order_by_direction) => {
  const params = {include,complete,inventory_exists,limit,start_after,order_by,order_by_direction};
  return await get(req, `inventory/hops`, params);
}

exports.getHop = async (req, include, id) => {
  const params = {include};
  return await get(req, `inventory/hops/${id}`, params);
}

exports.updateHop = async (req, inventory_adjust, inventory, id) => {
  const params = {inventory_adjust, inventory, id};
  return await patch(req, `inventory/hops/${id}`, params);
}

