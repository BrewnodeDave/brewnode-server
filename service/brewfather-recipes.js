/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const { get } = require('./common');

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
exports.getRecipes = async (req, include,complete,limit,start_after,order_by,order_by_direction) => {
  const params = {include,complete,limit,start_after,order_by,order_by_direction};
  return await get(req, `recipes`, params);
}

exports.getRecipe = async (req, include) => {
  const params = {include};
  return await get(req, `recipes`, params);
}

