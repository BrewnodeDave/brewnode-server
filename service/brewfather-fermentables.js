/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const {get, patch} = require('./common.js');

/**
 * Get Fermentables
 * This endpoint allows you to list your inventory items. It will only list items you have added manually or edited the default values for, or added an inventory amount on.
 *
 * inventory_negative Boolean If true, only include items with inventory < 0 (optional)
 * include String Array of additional fields to include when complete is false. Example \"fermentation,mash\" to include the fermentation and mash profile. (optional)
 * complete Boolean Valid values \"True\" or \"False\". Includes all the data in the result if True. Defaults to \"False\". If False only Name, Author, Style Name, Type is returned. (optional)
 * inventory_exists Boolean Valid values \"True\" or \"False\". If true, only include items with inventory > 0. Results will be ordered by inventory amount instead of _id. (optional)
 * limit Integer Amount of documents to fetch. (optional)
 * start_after String _id of the last item in the previous request (optional)
 * order_by String The field to order by, defaults to \"_id\" (optional)
 * order_by_direction String Direction to order result (optional)
 * no response value expected for this operation
 **/
exports.getFermentables = async (req, inventory_negative,include,complete,inventory_exists,limit,start_after,order_by,order_by_direction) => {
  const params = {inventory_negative,include,complete,inventory_exists,limit,start_after,order_by,order_by_direction};
  return await get(req, `inventory/fermentables`, params);
}

exports.getFermentable = async (req, include, id) => {
  const params = {include};
  return await get(req, `inventory/fermentables/${id}`, params);
}

exports.updateFermentable = async (req, inventory_adjust, inventory, id) => {
  const params = {inventory_adjust, inventory, id};
  return await patch(req, `inventory/fermentables/${id}`, params);
}


