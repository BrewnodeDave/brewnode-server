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
 * Get batch readings
 * This endpoint allows you to list your batches. By default it returns batches with all statuses. Use the query parameter \"status\" to query for a given status.
 *
 * include List Array of additional fields to include when complete is false. Example 'recipe.fermentation,recipe.mash' to include the fermentation and mash profile. (optional)
 * complete Boolean Inlcudes all the data in the result if True. If False only Name, Batch Number, Status, Brewer, Brew Date, Recipe Name is returned. (optional)
 * status String Current batch status (optional)
 * limit Integer Amount of documents to fetch. (optional)
 * start_after String _id of the last item in the previous request (optional)
 * order_by String The field to order by, defaults to \"_id\" (optional)
 * order_by_direction String Direction to order result (optional)
 * no response value expected for this operation
 **/
exports.batches = async(req, include, complete, status, limit, start_after, order_by, order_by_direction) => {
    const params = {include, complete, status, limit, start_after, order_by, order_by_direction};
    return await get(req, "batches", params);
}

/**
 * Get batch
 * This endpoint allows you to fetch a specific batch.
 *
 * id String 
 * include List Array of additional fields to include when complete is false. Example 'recipe.fermentation,recipe.mash' to include the fermentation and mash profile. (optional)
 * no response value expected for this operation
 **/
exports.batch = async(req, include, id) => {
  const params = {id, include};
  return await get(req, `batches/${id}`, params);
}


/**
 * Update batch
 * This endpoint allows you to update specific fields of a specific batch. Currently support setting the status and measured values.
 *
 * id String 
 * status String  (optional)
 * measuredMashPh Integer  (optional)
 * measuredBoilSize BigDecimal Pre-Boil Volume. Value in Litres (optional)
 * measuredFirstWortGravity BigDecimal Pre-Sparge Gravity. Value in SG. (optional)
 * measuredPreBoilGravity BigDecimal Pre-Boil Gravity. Value in SG. (optional)
 * measuredPostBoilGravity BigDecimal Post-Boil Gravity. Value in SG. (optional)
 * measuredKettleSize Integer Post-Boil Volume. Value in Littes (optional)
 * measuredOg BigDecimal Original Gravity. Value in SG (optional)
 * measuredFermenterTopUp BigDecimal Fermenter Top-Up. Value in Litres (optional)
 * measuredBatchSize BigDecimal Fermenter Volume. Value in Litres (optional)
 * measuredFg BigDecimal Final Gravity. Value in SG (optional)
 * measuredBottlingSize BigDecimal Final Bottling/Kegging Volume. Value in Litres (optional)
 * carbonationTemp BigDecimal  (optional)
 * no response value expected for this operation
 **/
exports.updateBatch = async (req, status,measuredMashPh,measuredBoilSize,measuredFirstWortGravity,measuredPreBoilGravity,measuredPostBoilGravity,measuredKettleSize,measuredOg,measuredFermenterTopUp,measuredBatchSize,measuredFg,measuredBottlingSize,carbonationTemp, id) => {
  const params = {id,status,measuredMashPh,measuredBoilSize,measuredFirstWortGravity,measuredPreBoilGravity,measuredPostBoilGravity,measuredKettleSize,measuredOg,measuredFermenterTopUp,measuredBatchSize,measuredFg,measuredBottlingSize,carbonationTemp};
  return await patch(req, `batches/${id}`, params);
}


/**
 * Get Batch Last Reading
 * This endpoint allows you to fetch the latest reading recieved
 *
 * id String 
 * no response value expected for this operation
 **/
exports.getLastBatchReading = async (req, id) =>{
  return await get(req, `batches/${id}/readings/last`, undefined);
}

exports.getAllBatchReadings = async (req, id) =>{
  return await get(req, `batches/${id}/readings`, undefined);
}

exports.getBatchBrewTracker = async (req, id) =>{
  return await get(req, `batches/${id}/brewtracker`, undefined);
}