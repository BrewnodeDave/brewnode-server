'use strict';

const axios = require("axios");
const {auth, root} = require('./BrewfatherCommon.js');


/**
 * @param {string} endpoint
 * @param {{ include: any; complete?: any; status?: any; limit?: any; start_after?: any; order_by?: any; order_by_direction?: any; id?: any; }} params
 */
async function get(endpoint, params){
  try {
      const config = { params, auth }
      const response = await axios.get(`${root}/${endpoint}`, config);
      return response.data;
  } catch (error) {
      console.error(error);
  }
}

async function patch(endpoint, params){
  try {
      const config = { params, auth }
      const response = await axios.patch(`${root}/${endpoint}`, config);
      return response.data;
  } catch (error) {
      console.error(error);
  }
}
exports.getYeasts = async (include,complete,inventory_exists,limit,start_after,order_by,order_by_direction) => {
  const params = {include,complete,inventory_exists,limit,start_after,order_by,order_by_direction};
  return await get(`inventory/yeasts`, params);
}

exports.getYeast = async (include, id) => {
  const params = {include};
  return await get(`inventory/yeasts/${id}`, params);
}

exports.updateYeast = async (inventory_adjust, inventory, id) => {
  const params = {inventory_adjust, inventory, id};
  return await patch(`inventory/yeasts/${id}`, params);
}
