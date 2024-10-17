/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const {get, patch} = require('../service/common.js');

async function batches (req, res, next, include, complete, status, limit, start_after, order_by, order_by_direction) {
  const params = {include, complete, status, limit, start_after, order_by, order_by_direction};
  const response = await get(req, "batches", params);
  res.status(response.status);
  res.send(response.data);  
};

async function batch (req, res, next, include, id) {
  const params = {include};
  const response = await get(req, `batches/${id}`, params);
  res.status(response.status);
  res.send(response.data);
    
};

async function getAllBatchReadings (req, res, next, id) {
  const response = await get(req, `batches/${id}/readings`, undefined);
  res.status(response.status);
  res.send(response.data);   
};

async function getBatchBrewTracker (req, res, next, id) {
  const response = await get(req, `batches/${id}/brewtracker`, undefined);
  res.status(response.status);
  res.send(response.data);  
};

async function getLastBatchReading (req, res, next, id) {
  const response = await get(req, `batches/${id}/readings/last`, undefined);
  res.status(response.status);
  res.send(response.data);
};

async function updateBatch (req, res, next, id, status, measuredMashPh, measuredBoilSize, measuredFirstWortGravity, measuredPreBoilGravity, measuredPostBoilGravity, measuredKettleSize, measuredOg, measuredFermenterTopUp, measuredBatchSize, measuredFg, measuredBottlingSize, carbonationTemp) {
  const params = {id,status,measuredMashPh,measuredBoilSize,measuredFirstWortGravity,measuredPreBoilGravity,measuredPostBoilGravity,measuredKettleSize,measuredOg,measuredFermenterTopUp,measuredBatchSize,measuredFg,measuredBottlingSize,carbonationTemp};
  const response = await patch(req, `batches/${id}`, params);
  res.status(response.status);
  res.send(response.data);
};

module.exports = {
  batch,
  batches,
  getAllBatchReadings,
  getBatchBrewTracker,
  getLastBatchReading,
  updateBatch
};
