'use strict';


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
exports.getFermentables = function(inventory_negative,include,complete,inventory_exists,limit,start_after,order_by,order_by_direction) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get Hops
 * This endpoint allows you to list your inventory items. It will only list items you have added manually or edited the default values for, or added an inventory amount on.
 *
 * include String Array of additional fields to include when complete is false. Example \"fermentation,mash\" to include the fermentation and mash profile. (optional)
 * complete Boolean Valid values \"True\" or \"False\". Includes all the data in the result if True. Defaults to \"False\". If False only Name, Author, Style Name, Type is returned. (optional)
 * inventory_exists Boolean Valid values \"True\" or \"False\". If true, only include items with inventory > 0. Results will be ordered by inventory amount instead of _id. (optional)
 * limit Integer Amount of documents to fetch. (optional)
 * start_after String _id of the last item in the previous request (optional)
 * order_by String The field to order by, defaults to \"_id\" (optional)
 * order_by_direction String Direction to order result (optional)
 * no response value expected for this operation
 **/
exports.getHops = function(include,complete,inventory_exists,limit,start_after,order_by,order_by_direction) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get Miscs
 * This endpoint allows you to list your inventory items. It will only list items you have added manually or edited the default values for, or added an inventory amount on.
 *
 * include String Array of additional fields to include when complete is false. Example \"fermentation,mash\" to include the fermentation and mash profile. (optional)
 * complete Boolean Valid values \"True\" or \"False\". Includes all the data in the result if True. Defaults to \"False\". If False only Name, Author, Style Name, Type is returned. (optional)
 * inventory_exists Boolean Valid values \"True\" or \"False\". If true, only include items with inventory > 0. Results will be ordered by inventory amount instead of _id. (optional)
 * limit Integer Amount of documents to fetch. (optional)
 * start_after String _id of the last item in the previous request (optional)
 * order_by String The field to order by, defaults to \"_id\" (optional)
 * order_by_direction String Direction to order result (optional)
 * no response value expected for this operation
 **/
exports.getMiscs = function(include,complete,inventory_exists,limit,start_after,order_by,order_by_direction) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

