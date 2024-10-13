'use strict';

var utils = require('../utils/writer.js');
var BrewfatherBatches = require('../service/BrewfatherBatchesService');

module.exports.batch = function batch (req, res, next, id, include) {
  BrewfatherBatches.batch(id, include)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.batches = function batches (req, res, next, include, complete, status, limit, start_after, order_by, order_by_direction) {
  BrewfatherBatches.batches(include, complete, status, limit, start_after, order_by, order_by_direction)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getAllBatchReadings = function getAllBatchReadings (req, res, next, id) {
  BrewfatherBatches.getAllBatchReadings(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBatchBrewTracker = function getBatchBrewTracker (req, res, next, id) {
  BrewfatherBatches.getBatchBrewTracker(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getLastBatchReading = function getLastBatchReading (req, res, next, id) {
  BrewfatherBatches.getLastBatchReading(id)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.updateBatch = function updateBatch (req, res, next, id, status, measuredMashPh, measuredBoilSize, measuredFirstWortGravity, measuredPreBoilGravity, measuredPostBoilGravity, measuredKettleSize, measuredOg, measuredFermenterTopUp, measuredBatchSize, measuredFg, measuredBottlingSize, carbonationTemp) {
  BrewfatherBatches.updateBatch(id, status, measuredMashPh, measuredBoilSize, measuredFirstWortGravity, measuredPreBoilGravity, measuredPostBoilGravity, measuredKettleSize, measuredOg, measuredFermenterTopUp, measuredBatchSize, measuredFg, measuredBottlingSize, carbonationTemp)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
