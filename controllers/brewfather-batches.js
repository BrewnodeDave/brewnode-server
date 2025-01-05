/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const {get, patch} = require('./common.js');

async function batches (req, res, next, include, complete, status, limit, start_after, order_by, order_by_direction) {
  const params = {include, complete, status, limit, start_after, order_by, order_by_direction};
  try {
    const response = await get(req, "batches", params);
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

async function batch (req, res, next, include, id) {
  const params = {include};
  try {
    const response = await get(req, `batches/${id}`, params);
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

async function getAllBatchReadings (req, res, next, id) {
  try{
    const response = await get(req, `batches/${id}/readings`, undefined);
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

async function getBatchBrewTracker (req, res, next, id) {
  try {
    const response = await get(req, `batches/${id}/brewtracker`, undefined);
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

async function getLastBatchReading (req, res, next, id) {
  try {
    const response = await get(req, `batches/${id}/readings/last`, undefined);
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

async function updateBatch (req, res, next, id, status, measuredMashPh, measuredBoilSize, measuredFirstWortGravity, measuredPreBoilGravity, measuredPostBoilGravity, measuredKettleSize, measuredOg, measuredFermenterTopUp, measuredBatchSize, measuredFg, measuredBottlingSize, carbonationTemp) {
  const params = {id,status,measuredMashPh,measuredBoilSize,measuredFirstWortGravity,measuredPreBoilGravity,measuredPostBoilGravity,measuredKettleSize,measuredOg,measuredFermenterTopUp,measuredBatchSize,measuredFg,measuredBottlingSize,carbonationTemp};
  try {
    const response = await patch(req, `batches/${id}`, params);
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
  batch,
  batches,
  getAllBatchReadings,
  getBatchBrewTracker,
  getLastBatchReading,
  updateBatch
};
