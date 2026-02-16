/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const fs = require('fs');
const path = require('path');
const probes = require('./probes.js');

/**
 * Simulated temperature sensor for testing without hardware
 */
let simulatedTemps = {};
probes.forEach(probe => {
  simulatedTemps[probe.id] = 20 + Math.random() * 10; // Random temps between 20-30°C
});

module.exports = {
  isDriverLoaded(cb) {
    cb(null, true);
  },

  list(cb) {
    cb(null, probes.map(p => p.id));
  },

  getAll(cb) {
    const result = {};
    probes.forEach(probe => {
      result[probe.id] = simulatedTemps[probe.id] + (Math.random() - 0.5) * 0.5;
    });
    cb(null, result);
  },

  get(probeId, cb) {
    if (simulatedTemps[probeId] !== undefined) {
      const temp = simulatedTemps[probeId] + (Math.random() - 0.5) * 0.5;
      cb(null, temp);
    } else {
      cb(new Error('Sensor not found: ' + probeId));
    }
  },

  getByName(name) {
    const probe = probes.find(p => p.name === name);
    return probe ? simulatedTemps[probe.id] : null;
  },

  set(name, t) {
    const probe = probes.find(p => p.name === name);
    if (probe) {
      simulatedTemps[probe.id] = t;
    }
  },

  setAll(temp) {
    probes.forEach(probe => {
      simulatedTemps[probe.id] = temp;
    });
  }
};
