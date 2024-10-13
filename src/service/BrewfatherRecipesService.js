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
/**
 * Get Recipes
 * This endpoint allows you to list your recipes.
 *
 * include String Array of additional fields to include when complete is false. Example \"fermentation,mash\" to include the fermentation and mash profile. (optional)
 * complete Boolean Valid values \"True\" or \"False\". Includes all the data in the result if True. Defaults to \"False\". If False only Name, Author, Style Name, Type is returned. (optional)
 * limit Integer Amount of documents to fetch. (optional)
 * start_after String _id of the last item in the previous request (optional)
 * order_by String The field to order by, defaults to \"_id\" (optional)
 * order_by_direction String Direction to order result (optional)
 * no response value expected for this operation
 **/
exports.getRecipes = async (include,complete,limit,start_after,order_by,order_by_direction) => {
  const params = {include,complete,limit,start_after,order_by,order_by_direction};
  return await get(`recipes`, params);
}

exports.getRecipe = async (include) => {
  const params = {include};
  return await get(`recipes`, params);
}

