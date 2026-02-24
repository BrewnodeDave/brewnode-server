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
 * Simulates a counterflow heat exchanger:
 *   Hot side: Kettle (80°C) → Glycol (30°C)
 *   Cold side: UniTank (5°C) → Mash (25°C)
 */
let simulatedTemps = {};
probes.forEach(probe => {
  // Set realistic heat exchanger temperatures
  if (probe.name === 'Temp Kettle') {
    simulatedTemps[probe.id] = 80; // Hot inlet
  } else if (probe.name === 'Temp Glycol') {
    simulatedTemps[probe.id] = 30; // Hot outlet
  } else if (probe.name === 'Temp UniTank') {
    simulatedTemps[probe.id] = 5;  // Cold inlet
  } else if (probe.name === 'Temp Mash') {
    simulatedTemps[probe.id] = 30; // Hot outlet
  } else if (probe.name === 'Temp UniTank') {
    simulatedTemps[probe.id] = 5;  // Cold inlet
  } else if (probe.name === 'Temp Glycol') {
    simulatedTemps[probe.id] = 25; // Cold outlet
  } else {
    simulatedTemps[probe.id] = 20 + Math.random() * 10;
  }
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
      // Add small realistic variation (±0.5°C)
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
