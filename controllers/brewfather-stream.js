/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const http = require('http');

async function stream (req, res, next, 
  name, 
  temp, 
  auxTemp, 
  extTemp, 
  tempUnit, 
  gravity, 
  gravityUnit,
  pressure,
  pressureUnits,
  ph,
  bpm,
  comment,
  beer,
  battery,
  deviceIntegration,
  deviceSource,
  reportSource,
  deviceState,
  tempTarget,
  gravityTarget,
  hysterisis,
  angle,
  rssi,
  count,
  volume,
  volumeUnit,
  pourVolume,
  maxVolume,
  percentage, 
  id) {
  const body = {
    name,
    temp,
    auxTemp,
    extTemp,
    tempUnit,
    gravity,
    gravityUnit,
    pressure,
    pressureUnits,
    ph,
    bpm,
    comment,
    beer,
    battery,
    deviceIntegration,
    deviceSource,
    reportSource,
    deviceState,
    tempTarget,
    gravityTarget,
    hysterisis,
    angle,
    rssi,
    count,
    volume,
    volumeUnit,
    pourVolume,
    maxVolume,
    percentage
  };    
  const response = await post(JSON.stringify(body), id);
  res.status(response.statusCode);
  res.end();
 };

function post(data, id = process.env.BREWFATHER_CUSTOM_STREAM) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "log.brewfather.net",
      path: `/stream?id=${id}`,
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          "Content-Length": data.length
      }
    };

    const req = http.request(options, res => {
      res.on("data", x => {
        resolve(res);
      });
    });

    req.on("error",err => {
      reject(err)
    });

    req.write(data);
    req.end();
  });
}


module.exports = {
  post,
  stream,
};
