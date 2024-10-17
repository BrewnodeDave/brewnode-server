/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const brewnode = require('../service/brewnode.js');
const {promiseSerial} = require('../src/brew-pub.js');

const {doMashStep} = require('../service/brewnode.js');
const { getAuth } = require('../service/common.js');

async function whatsBrewing (req, res, next) {
  const auth = getAuth(req);
  const result = await brewnode.whatsBrewing(auth);
  if (result instanceof Error) {
    res.status(500);
    res.send(result.message);
  }else{
    res.status(200);
    res.send(result);
  }
};

async function getInventory (req, res, next) {
  const auth = getAuth(req);
  const result = await brewnode.getInventory(auth);
  res.status(200);
  res.send(result);
};

async function boil (req, res, next, mins) {
  const result = await brewnode.boil(mins)
  res.status(200);
  res.send(result);
};

async function chill (req, res, next, profile) {
  const result = await brewnode.chill(profile)
  res.status(200);
  res.send(result);
};

async function ferment (req, res, next, profile) {
  const result = await brewnode.ferment(profile)
  res.status(200);
  res.send(result);
};

async function k2f (req, res, next, flowTimeoutSecs) {
  const result = brewnode.k2f(flowTimeoutSecs)
  res.status(200);
  res.send(result);
};

/**
 * Handles the k2m request by invoking the brewnode.k2m function with the specified flow timeout.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {number} flowTimeoutSecs - The flow timeout in seconds.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function k2m (req, res, next, flowTimeoutSecs) {
  const result = await brewnode.k2m(flowTimeoutSecs)
  res.status(200);
  res.send(result);
};

/**
 * Handles the m2k request and sends the result as a response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {number} flowTimeoutSecs - The timeout in seconds for the flow.
 * @returns {Promise<void>} - A promise that resolves when the operation is complete.
 */
async function m2k (req, res, next, flowTimeoutSecs) {
  const result = await brewnode.m2k(flowTimeoutSecs)
  res.status(200);
  res.send(result);
};

/**
 * Handles the request to set the kettle temperature.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {number} temp - The temperature to set the kettle to.
 * @param {number} mins - The duration in minutes to maintain the temperature.
 * @returns {Promise<void>} - A promise that resolves when the temperature is set.
 */
async function kettleTemp (req, res, next, temp, mins) {
  const result = await brewnode.kettleTemp(temp, mins);
  res.status(200);
  res.send(result);
};

async function restart (req, res, next) {
  const result = await brewnode.restart();
  res.status(200);
  res.send(result);
};

async function getStatus (req, res, next) {
  const result = brewnode.getStatus();
  res.status(200);
  res.send(result);
};

async function heat (req, res, next, onOff) {
  const result = await brewnode.heat(onOff);
  
  res.status(200);
  res.send(result);
};

async function mash (req, res, next, steps) {
  const stepRequests = steps.map(doMashStep);
  
  const stepResponses = await promiseSerial(stepRequests);

  res.status(response.status);
  res.send(response.data);
};

async function fill (req, res, next, litres) {
  const result = await brewnode.fill(litres);
  res.status(200);
  res.send(result);
};


module.exports = {
  boil,
  chill,
  ferment,
  fill,
  whatsBrewing,
  getInventory,
  getStatus,
  heat,
  kettleTemp,
  mash,
  m2k,
  k2f,
  k2m,
  restart
}