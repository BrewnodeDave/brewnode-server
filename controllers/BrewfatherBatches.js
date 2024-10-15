/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

var utils = require('../utils/writer.js');
var BrewfatherBatches = require('../service/brewfather-batches');

module.exports.batch = function batch (req, res, next, id, include) {
  BrewfatherBatches.batch(req, id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.batches = function batches (req, res, next, include, complete, status, limit, start_after, order_by, order_by_direction) {
  BrewfatherBatches.batches(req, include, complete, status, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAllBatchReadings = function getAllBatchReadings (req, res, next, id) {
  BrewfatherBatches.getAllBatchReadings(req, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBatchBrewTracker = function getBatchBrewTracker (req, res, next, id) {
  BrewfatherBatches.getBatchBrewTracker(req, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLastBatchReading = function getLastBatchReading (req, res, next, id) {
  BrewfatherBatches.getLastBatchReading(req, id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateBatch = function updateBatch (req, res, next, id, status, measuredMashPh, measuredBoilSize, measuredFirstWortGravity, measuredPreBoilGravity, measuredPostBoilGravity, measuredKettleSize, measuredOg, measuredFermenterTopUp, measuredBatchSize, measuredFg, measuredBottlingSize, carbonationTemp) {
  BrewfatherBatches.updateBatch(req, id, status, measuredMashPh, measuredBoilSize, measuredFirstWortGravity, measuredPreBoilGravity, measuredPostBoilGravity, measuredKettleSize, measuredOg, measuredFermenterTopUp, measuredBatchSize, measuredFg, measuredBottlingSize, carbonationTemp)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
