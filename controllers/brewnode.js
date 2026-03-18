/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';
const fs = require('fs');

const tempService = require('../src/services/temp-service.js');
const glycol = require('../src/services/glycol-service.js');
const k2m = require('../src/brewstack/brewingAlgorithms/k2m.js');
const m2k = require('../src/brewstack/brewingAlgorithms/m2k.js');
const k2f = require('../src/brewstack/brewingAlgorithms/k2f.js');
const sim = require('../src/sim/sim.js');
const kettleHeater = require('../src/services/kettle-heater-service.js');  
const glycolHeater = require('../src/services/glycol-heater-service.js');  
const glycolChiller = require('../src/services/glycol-chiller-service.js');  
const fillService = require('../src/services/fill-service.js');
const therm = require('../src/services/temp-service.js');
const pumps = require('../src/services/pump-service.js');
// const flow = require('../src/services/flow-service.js');
const wdog = require('../src/services/wdog-service.js');
const fan = require('../src/services/fan-service.js');
const temp = require('../src/services/temp-service.js');
const valves = require('../src/services/valve-service.js');
const tempController = require('../src/services/temp-controller-service.js');
const startStop = require('../src/start-stop.js');
const {progressPublish, remainingMashMinutes, remainingBoilMinutes, remainingKettleMinutes} = require('../src/publish.js');

const brewlog = require('../src/brewstack/common/brewlog.js');
const delay = require('../src/brewstack/common/delay.js');

const axios = require('axios');
const { brewfatherV2, getAuth } = require('./common.js');
const mysqlService = require('../src/services/mysql-service.js');
const {getSimulationSpeed} = require('../src/sim/sim.js');
const {DIR_OUTPUT, setDir, writeBit} = require('../src/services/i2c_raspi-service.js');
const flowTimeoutSecs = 5;

const promiseSerial = funcs =>
  funcs.reduce((promise, f) =>
    promise.then(result => f().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]));

async function whatsBrewing (req, res, next) {
  const auth = getAuth(req);
  const params = {
    "complete": true, 
    "status": 'Brewing',
  };  
  
  const config = { params, auth};  
  try {
    const response = await axios.get(`${brewfatherV2}/batches`, config);
    const numBrewing = response.data.length;
    if (numBrewing === 0) {
      const params = {
        "complete": true, 
        "status": 'Fermenting'
      }; 
      const config = { params, auth};  
      const response = await axios.get(`${brewfatherV2}/batches`, config);
      const numBrewing = response.data.length;
      if (numBrewing === 0) {
        res.send(400, "No brews in progress!");
      } else {
        // progressPublish(response.data[0].recipe.name);
        const recipe = response.data[0].recipe;
        recipe.name = `${recipe.name}-${response.data[0].batchNo}`;
        res.send(200, recipe);
        }
    } else if (numBrewing === 1) {
      // progressPublish(response.data[0].recipe.name);
      const recipe = response.data[0].recipe;
      recipe.name = `${recipe.name}-${response.data[0].batchNo}`;
      res.send(200, recipe);
    } else {
      progressPublish.error(`Multiple brews in progress!`);
      res.send(400, `Multiple brews in progress!`);
    }
  } catch (error) {
    progressPublish.critical(`Error getting brew info: ${error.message}`);
    res.send(500, error.message);
  }
}

async function i2cSet(req, res, next, bit, value) {
  try {
    setDir(bit, DIR_OUTPUT);
    const result = writeBit(bit, value);
    res.send(200, result);
  } catch (error) {
    progressPublish.critical(`Error in i2cSet: ${error.message}`);
    res.send(500, error.message);
  }
}

async function getBrewData (req, res, next) {
  try {
    const {highcharts, latestTimestamp} = await mysqlService.getBrewData(req.query.brewname, req.query.since);
    const latest = latestTimestamp ? latestTimestamp : '';
    res.send(200, {highcharts, latestTimestamp:latest});
  }catch (err) {
    progressPublish.critical(`Error getting brew data: ${err.message}`);
    res.send(500, err.message);
  }
}

async function getInventory (req, res, next) {
  const auth = getAuth(req);
  const params = {
    "complete": true, 
    "status": 'Brewing',
  };  
  const config = { params, auth};  

  try {
    const fermentables = await axios.get(`${brewfatherV2}/inventory/fermentables`, config);
    const yeasts = await axios.get(`${brewfatherV2}/inventory/yeasts`, config);
    const hops = await axios.get(`${brewfatherV2}/inventory/hops`, config);
    const miscs = await axios.get(`${brewfatherV2}/inventory/miscs`, config);
    
    res.status(200).send({
      fermentables:fermentables.data,
      hops: hops.data,
      yeasts:yeasts.data,
      miscs:miscs.data
    });
  } catch (error) { 
    if (error.response && error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterSeconds = retryAfter ? parseInt(retryAfter, 10) : 0;
      progressPublish.critical(`Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`);
      res.send(429, `Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
      progressPublish.critical(`Error getting inventory: ${error.message}`);
      res.status(error.response ? error.response.status : 500).send(error.message);
    }
  };
}; 

async function boil (req, res, next, mins) {
  await tempController.init(600, 0.3, 100);
  await tempController.setTemp(
    100, 
    (getSimulationSpeed() !== 1)
      ? (mins / getSimulationSpeed()) 
      : mins,
    remainingBoilMinutes
  );
  tempController.stop();

  res.send(200, `Boil Complete`);
};

async function chill (req, res, next, profile) {
  progressPublish(`Chilling`);

  await glycol.doSteps(profile);

  progressPublish('');
  res.send(200, "Chill Complete");
};

async function ferment (req, res, next, profile) {
  progressPublish(`Fermenting`);

  await glycol.doSteps(profile);

  progressPublish(``);
  res.send(200, "Ferment Complete");
};

async function kettle2fermenter (req, res, next, flowTimeoutSecs) {
  progressPublish(`Transferring to fermenter`);
  const result = await k2f.transfer({flowTimeoutSecs});
  progressPublish(``);
  res.send(200, result);
};

async function kettle2mashtun (req, res, next, flowTimeoutSecs) {
  progressPublish(`Transferring to mashtun`);
  const result = await k2m.transfer({flowTimeoutSecs});
  progressPublish(``);
  res.send(200, result);
};

async function mash2kettle (req, res, next, flowTimeoutSecs) {
  progressPublish(`Transferring to kettle`);
  const result = await m2k.transfer({flowTimeoutSecs});
  progressPublish(``);
  res.send(200, result);
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
async function setKettleTemp (req, res, next, tempC, mins) {
  // progressPublish(`Setting kettle to ${tempC}C for ${mins} mins`);
  await tempController.init(800, 0.3, 100);
  await tempController.setTemp(
    tempC, 
    (getSimulationSpeed() !== 1)  
      ? (mins / getSimulationSpeed()) 
      : mins,
    remainingKettleMinutes
  );
  tempController.stop();
  
  res.send(200, `Kettle reached ${tempC}`);
};

async function getKettleTemp (req, res, next) {
  const result = await tempService.getTemp("Temp Kettle");
  res.send(200, `${result}`);
};

async function getKettleVolume (req, res, next) {
  const litres = sim.getKettleVolume();
  res.send(200, `${litres}`);
};

async function setKettleVolume (req, res, next, litres) {
  sim.setKettleVolume(litres);
  res.send(200, `Simulated kettle volume set to ${litres} litres`);
};

async function getSimSpeed (req, res, next) {
  const factor = sim.getSimulationSpeed();
  res.status(200).json({ factor });
};

async function setSimulationSpeed (req, res, next, factor) {
  sim.setSimulationSpeed(factor);
  res.status(200).json({ message: `Simulated speed factor = ${factor}`, factor });
};

async function getSystemStatus (req, res, next) {
  try {
    const brewdefs = require('../src/brewstack/common/brewdefs.js');
    const isRaspberryPi = brewdefs.isRaspPi();
    const simulationSpeed = sim.getSimulationSpeed();
    
    const systemStatus = {
      platform: isRaspberryPi ? 'Raspberry Pi' : process.platform,
      isHardware: isRaspberryPi,
      isSimulation: !isRaspberryPi,
      simulationSpeed: simulationSpeed,
      mode: isRaspberryPi ? 'Hardware' : 'Simulation'
    };
    
    res.status(200).json(systemStatus);
  } catch (error) {
    progressPublish.error("Error getting system status:", error);
    res.send(500, 'Internal Server Error');
  }
};

async function restart (req, res, next) {
  try {
    brewlog.warn("Restarting server...");
    await startStop.restart();
    res.send(200, "Restarted server");
  } catch (error) {
    progressPublish.error("Error restarting server:", error);
    res.send(500, "Internal Server Error");
  }
};

async function glycolChill(req, res, next, onOff) {
  const watts = (onOff === 'On') ? glycolChiller.switchOn() : glycolChiller.switchOff(); 
  res.send(200, watts);
};

async function glycolHeat(req, res, next, onOff) {
  const watts = (onOff === 'On') ? glycolHeater.switchOn() : glycolHeater.switchOff(); 
  res.send(200, watts);
};

async function sensorStatus(req, res, next) {
  try {
    let result = [];
    let f;
console.log(req.query.name);
    switch(req.query.name){
      case "Valve Kettle-in":
        result = valves.getStatus().find(v => v.name === "Valve Kettle-in").value;
        break; 
      case "Valve Mash-in": 
        result = valves.getStatus().find(v => v.name === "Valve Mash-in").value;
        break;
      case "Valve Chiller wort-in":
        result = valves.getStatus().find(v => v.name === "Valve Chiller wort-in").value;
        break;
      case "Valve Chiller wort-out":
        result = valves.getStatus().find(v => v.name === "Valve Chiller wort-out").value;
        break;
      case "Pump Kettle":
        result = pumps.getStatus().find(p => p.name === "Pump Kettle")?.value;
        break;
      case "Pump Mash":
        result = pumps.getStatus().find(p => p.name === "Pump Mash")?.value;
        break;
      case "Pump Glycol":
        result = pumps.getStatus().find(p => p.name === "Pump Glycol")?.value;
        break;
      case "Watchdog":
        result = wdog.getStatus();
        break;
      case "Fan":
        result = fan.getStatus();
        break;
      case "Glycol Heater":
        result = glycolHeater.getStatus();
        break;
      case "Glycol Chiller":
        result = glycolChiller.getStatus();
        break;
      case "Kettle Heater":
        result = kettleHeater.getStatus();
        break;
      case "Pumps":
        result = pumps.getStatus().flat();
        break;
      case "Valves":
        result = valves.getStatus().flat();
        break;
      case "Temperatures":
        result = await temp.getStatus();
        break;
      case "Temp Kettle":
      case "Temp Mash":
      case "Temp Fermenter":
      case "Temp Glycol":
      case "Temp Ambient":
        result = await temp.getTemp(req.query.name);
        break
      case "All":
        const tempStatus = await temp.getStatus();
        result.push(tempStatus.flat());
        result.push(pumps.getStatus().flat());
        // result.push(flow.getStatus().flat());
        result.push(wdog.getStatus());
        result.push(fan.getStatus());
        result.push(glycolHeater.getStatus());
        result.push(glycolChiller.getStatus());
        result.push(kettleHeater.getStatus());
        result.push(valves.getStatus().flat());

        result = result.flat();
        break;
      default:
        progressPublish.error(`Unknown sensor name: ${req.query.name}`);
        res.send(400, `Unknown sensor name: ${req.query.name}`);
        return;
    }
    res.status(200).json(result);
  } catch (error) {
    progressPublish.error(`Error getting status: ${error.message}`);
    res.send(500, 'Internal Server Error');
  }
}

/**
 * Handles the request to get the status of the pumps.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the status is sent.
 */
async function pumpsStatus(req, res, next) {
  try {
    res.status(200).json(pumps.getStatus().flat());
  } catch (error) {
    progressPublish.error(`Error getting status: ${error.message}`);
    res.send(500, 'Internal Server Error');
  }
}

/**
 * Handles the request to get the status of the valves.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the status is sent.
 */
async function valvesStatus(req, res, next) {
  try {
    res.status(200).json(valves.getStatus().flat());
  } catch (error) {
    progressPublish.error(`Error getting status: ${error.message}`);
    res.send(500, 'Internal Server Error');
  }
}

/**
 * Handles the request to get the status of the fan.
 *
 * @async
 * @function fanStatus
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @returns {Promise<void>} - A promise that resolves when the status is sent.
 * @throws {Error} - If there is an error getting the fan status.
 */
async function fanStatus(req, res, next) {
  try {
    res.status(200).json(fan.getStatus());
  } catch (error) {
    progressPublish.error(`Error getting status: ${error.message}`);
    res.send(500, 'Internal Server Error');
  }
}


/**
 * Controls the heater by turning it on or off based on the provided parameter.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} onOff - A string indicating whether to turn the heater 'On' or 'Off'.
 * @returns {void}
 */
async function heat (req, res, next, onOff) {
  const watts = (onOff === 'On') ? kettleHeater.forceOn() : kettleHeater.forceOff(); 
  res.send(200, watts);
};

/**
 * Controls the state of the fan based on the onOff parameter and sends the response.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} onOff - The state to set the fan to, either 'On' or 'Off'.
 * @returns {void}
 */
async function extractor (req, res, next, onOff) {
  const watts = (onOff === 'On') ? fan.switchOn() : fan.switchOff(); 
  res.send(200, watts);
};

/**
 * Controls the state of a specified valve.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} valveName - The name of the valve to control.
 * @param {string} openClose - The action to perform on the valve ('Open' or 'Close').
 */
async function valve(req, res, next, valveName, openClose) {
  const watts = (openClose === 'Open') ? valves.open(valveName) : valves.close(valveName); 
  res.send(200, watts);
}

/**
 * Controls the state of a specified pump.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} pumpName - The name of the pump to control.
 * @param {string} onOff - The desired state of the pump ('On' or 'Off').
 * @returns {void}
 */
async function pump(req, res, next, pumpName, onOff) {
  const watts = (onOff === 'On') ? pumps.on(pumpName) : pumps.off(pumpName); 
  res.send(200, watts);
} 

// Global variables to store pump modulation intervals
// Tracks ALL pending setTimeout handles inside the pump modulation cycle.
// Using a Set (rather than a single handle) ensures every nested callback
// can be cancelled on stop, preventing dangling timers from toggling pumps
// during the next step's preheat phase.
let kettlePumpModulationTimers = new Set();
// Module-level cycle state — shared across all calls to startStopKettlePumpModulation
// so that restarting the cycle always resets the state seen by the new cycle's callbacks.
let pumpsRunning = false;
// Incremented each time the cycle is (re)started. Callbacks capture their generation
// at creation time and bail out if it no longer matches, making stale callbacks no-ops.
let cycleGeneration = 0;
let mashPumpModulationInterval = null;
let recirculationInterval = null;

// Track recirculation state
let recirculationState = {
  active: false,
  targetTemp: null,
  dutyCycle: null,
  onSecs: null,
  offSecs: null
  ,
  mashDutyCycle: null,
  mashOnSecs: null,
  mashOffSecs: null
};

/**
 * Internal helper to start/stop kettle pump modulation without sending HTTP response.
 * @param {number|null} onSecs - Duration in seconds to keep pump on, or null to stop
 * @param {number|null} offSecs - Duration in seconds to keep pump off, or null to stop
 * @returns {Object} Result object with success status and message
 */
function startStopKettlePumpModulation(onSecs, offSecs) {
  // If no parameters provided, stop modulation
  if (!onSecs && !offSecs) {
    if (kettlePumpModulationTimers.size > 0) {
      kettlePumpModulationTimers.forEach(t => clearTimeout(t));
      kettlePumpModulationTimers.clear();
      pumps.off("Pump Kettle");
      pumps.off("Pump Mash");
      valves.close("Valve Mash-in");
      return { success: true, message: "Kettle pump modulation stopped" };
    } else {
      return { success: true, message: "Kettle pump modulation was not active" };
    }
  }
  
  // Validate parameters
  const onSecsNum = parseFloat(onSecs);
  const offSecsNum = parseFloat(offSecs);
  
  if (isNaN(onSecsNum) || isNaN(offSecsNum) || onSecsNum < 0.1 || onSecsNum > 3600 || offSecsNum < 0.1 || offSecsNum > 3600) {
    progressPublish.error(`Invalid pump modulation parameters: onSecs=${onSecs}, offSecs=${offSecs}`);
    return { success: false, message: "Invalid parameters: onSecs and offSecs must be numbers between 0.1 and 3600", status: 400 };
  }

  // Stop any existing modulation — cancel every pending handle.
  // Also stop mash pump modulation: it runs independently and will fight
  // the kettle cycle if both are active at the same time.
  if (kettlePumpModulationTimers.size > 0) {
    kettlePumpModulationTimers.forEach(t => clearTimeout(t));
    kettlePumpModulationTimers.clear();
    pumps.off("Pump Kettle");
    pumps.off("Pump Mash");
    valves.close("Valve Mash-in");
  }
  if (mashPumpModulationInterval) {
    clearTimeout(mashPumpModulationInterval);
    mashPumpModulationInterval = null;
  }
  
  // Adjust timing for simulation speed
  const simSpeed = getSimulationSpeed();
  const adjustedOnSecs = onSecsNum / simSpeed;
  const adjustedOffSecs = offSecsNum / simSpeed;

  // Reset shared cycle state so the new cycle always starts from OFF.
  pumpsRunning = false;
  // Advance the generation so any already-queued callbacks from the previous
  // cycle see a stale generation and exit immediately.
  const myGeneration = ++cycleGeneration;

  // Helper: schedule a timeout, register it in the Set so it can be
  // cancelled by stop(), and auto-remove it from the Set when it fires.
  const scheduleTimer = (fn, delayMs) => {
    const handle = setTimeout(() => {
      kettlePumpModulationTimers.delete(handle);
      fn();
    }, delayMs);
    kettlePumpModulationTimers.add(handle);
    return handle;
  };

  // Define the cycling function
  const cycle = () => {
    if (myGeneration !== cycleGeneration) return; // stale callback — a newer cycle has started
    if (pumpsRunning) {
      // ON → OFF: stop pumps and close valve immediately, then wait off period
      pumps.off("Pump Kettle");
      pumps.off("Pump Mash");
      valves.close("Valve Mash-in");
      pumpsRunning = false;
      scheduleTimer(cycle, adjustedOffSecs * 1000);
    } else {
      // OFF → ON: open valve first, then start pumps after a short delay to
      // allow the solenoid to fully open before flow is demanded.
      valves.open("Valve Mash-in");
      pumpsRunning = true;
      scheduleTimer(() => {
        if (myGeneration !== cycleGeneration) return;
        pumps.on("Pump Kettle");
        pumps.on("Pump Mash");
        scheduleTimer(cycle, adjustedOnSecs * 1000);
      }, 500);
    }
  };
  
  // Start the first cycle (turn pump on)
  cycle();
  
  return {
    success: true,
    message: "Kettle pump modulation started",
    onSecs: onSecsNum,
    offSecs: offSecsNum
  };
}

/**
 * Modulate the kettle pump on/off cycling for RIMS applications.
 * Continuously cycles the pump on and off for specified durations.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express next middleware function
 * @param {number} onSecs - Duration in seconds to keep pump on during each cycle
 * @param {number} offSecs - Duration in seconds to keep pump off during each cycle
 */
async function kettlePumpModulate(req, res, next, onSecs, offSecs) {
  try {
    const result = startStopKettlePumpModulation(onSecs, offSecs);
    
    if (!result.success) {
      res.send(result.status || 500, result.message);
      return;
    }
    
    res.send(200, result);
    
  } catch (error) {
    console.error(error);
    res.send(500, error.message);
  }
}

/**
 * Internal helper to start/stop mash pump modulation without sending HTTP response.
 * @param {number|null} onSecs - Duration in seconds to keep pump on, or null to stop
 * @param {number|null} offSecs - Duration in seconds to keep pump off, or null to stop
 * @returns {Object} Result object with success status and message
 */
function startStopMashPumpModulation(onSecs, offSecs) {
  // If no parameters provided, stop modulation
  if (!onSecs && !offSecs) {
    if (mashPumpModulationInterval) {
      clearTimeout(mashPumpModulationInterval);
      mashPumpModulationInterval = null;
      pumps.off("Pump Mash");
      return { success: true, message: "Mash pump modulation stopped" };
    } else {
      return { success: true, message: "Mash pump modulation was not active" };
    }
  }

  // Validate parameters
  const onSecsNum = parseFloat(onSecs);
  const offSecsNum = parseFloat(offSecs);
  if (isNaN(onSecsNum) || isNaN(offSecsNum) || onSecsNum < 0.1 || onSecsNum > 3600 || offSecsNum < 0.1 || offSecsNum > 3600) {
    progressPublish.error(`Invalid mash pump modulation parameters: onSecs=${onSecs}, offSecs=${offSecs}`);
    return { success: false, message: "Invalid parameters: onSecs and offSecs must be numbers between 0.1 and 3600", status: 400 };
  }

  // Stop any existing modulation
  if (mashPumpModulationInterval) {
    clearTimeout(mashPumpModulationInterval);
    mashPumpModulationInterval = null;
    pumps.off("Pump Mash");
  }

  const simSpeed = getSimulationSpeed();
  const adjustedOnSecs = onSecsNum / simSpeed;
  const adjustedOffSecs = offSecsNum / simSpeed;

  const cycle = () => {
    const pumpStatus = pumps.getStatus().find(p => p.name === "Pump Mash")?.value || 0;
    if (pumpStatus !== 0) {
      pumps.off("Pump Mash");
      mashPumpModulationInterval = setTimeout(cycle, adjustedOffSecs * 1000);
    } else {
      pumps.on("Pump Mash");
      mashPumpModulationInterval = setTimeout(cycle, adjustedOnSecs * 1000);
    }
  };
  cycle();
  return { success: true, message: "Mash pump modulation started" };
}

/**
 * Get current recirculation status.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express next middleware function
 */
async function getRecirculationStatus(req, res, next) {
  try {
    res.send(200, recirculationState);
  } catch (error) {
    console.error(error);
    res.send(500, error.message);
  }
}

/**
 * Update kettle pump duty cycle during active recirculation.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express next middleware function
 * @param {number} dutyCycle - Kettle pump duty cycle as percentage (1-99)
 */
async function updateDutyCycle(req, res, next, dutyCycle, mashDutyCycle) {
  try {
    // Check if recirculation is active
    if (kettlePumpModulationTimers.size === 0) {
      res.send(400, "Cannot update duty cycle: recirculation is not active");
      return;
    }
    
    // Validate dutyCycle parameter
    const pumpDutyCycle = parseFloat(dutyCycle);
    if (isNaN(pumpDutyCycle) || pumpDutyCycle < 1 || pumpDutyCycle > 99) {
      res.send(400, "Invalid dutyCycle: must be between 1 and 99 percent");
      return;
    }
    
    // Calculate on/off times based on duty cycle
    const totalCycleTime = 13;
    const kettleOnSecs = (pumpDutyCycle / 100) * totalCycleTime;
    const kettleOffSecs = totalCycleTime - kettleOnSecs;
    
    // Update kettle pump modulation with new duty cycle
    const modulationResult = startStopKettlePumpModulation(kettleOnSecs, kettleOffSecs);
    if (!modulationResult.success) {
      res.send(modulationResult.status || 500, modulationResult.message);
      return;
    }
    
    // Update recirculation state
    recirculationState.dutyCycle = pumpDutyCycle;

    // handle mash pump adjustment if provided
    if (mashDutyCycle) {
      const mashCycle = parseFloat(mashDutyCycle);
      if (isNaN(mashCycle) || mashCycle < 1 || mashCycle > 99) {
        res.send(400, "Invalid mashDutyCycle: must be between 1 and 99 percent");
        return;
      }
      const totalCycleTime = 13;
      const mashOnSecs = (mashCycle / 100) * totalCycleTime;
      const mashOffSecs = totalCycleTime - mashOnSecs;
      const mashResult = startStopMashPumpModulation(mashOnSecs, mashOffSecs);
      if (!mashResult.success) {
        res.send(mashResult.status || 500, mashResult.message);
        return;
      }
      recirculationState.mashDutyCycle = mashCycle;
      recirculationState.mashOnSecs = parseFloat(mashOnSecs.toFixed(2));
      recirculationState.mashOffSecs = parseFloat(mashOffSecs.toFixed(2));
    }
    recirculationState.onSecs = parseFloat(kettleOnSecs.toFixed(2));
    recirculationState.offSecs = parseFloat(kettleOffSecs.toFixed(2));
    
    res.send(200, {
      message: "Duty cycle updated",
      kettlePumpDutyCycle: pumpDutyCycle,
      kettlePumpOnSecs: kettleOnSecs.toFixed(2),
      kettlePumpOffSecs: kettleOffSecs.toFixed(2)
    });
    
  } catch (error) {
    console.error(error);
    res.send(500, error.message);
  }
}

/**
 * Recirculate between kettle and mash tun.
 * Turns on mash pump continuously and modulates kettle pump with configurable duty cycle.
 * Controls mash temperature by turning kettle heater on/off.
 * Call with onOff="Off" to stop recirculation.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express next middleware function
 * @param {string} onOff - "On" to start recirculation, "Off" to stop
 * @param {number} tempC - Target mash temperature in Celsius (required when onOff="On")
 * @param {number} dutyCycle - Kettle pump duty cycle as percentage (1-99, default: 23% = 3s on / 10s off)
 * @param {number} mashDutyCycle - Optional mash pump duty cycle (1-99); if provided the mash pump will cycle instead of run continuously.
 */
async function recirculate(req, res, next, onOff, tempC, dutyCycle, mashDutyCycle) {
  try {
    if (onOff === "Off") {
      // Stop recirculation
      if (recirculationInterval) {
        clearInterval(recirculationInterval);
        recirculationInterval = null;
      }
      
      // Stop temperature control
      tempController.pause();
      
      // Stop kettle pump modulation and turn off mash pump
      startStopKettlePumpModulation(null, null);
      startStopMashPumpModulation(null, null);
      
      // Clear recirculation state
      recirculationState = {
        active: false,
        targetTemp: null,
        dutyCycle: null,
        onSecs: null,
        offSecs: null
        ,mashDutyCycle: null,
        mashOnSecs: null,
        mashOffSecs: null
      };
      
      res.send(200, { message: "Recirculation stopped" });
      return;
    }
    
    // Validate temperature parameter
    const targetTemp = parseFloat(tempC);
    if (isNaN(targetTemp) || targetTemp < 0 || targetTemp > 100) {
      res.send(400, "Invalid temperature: must be between 0 and 100°C");
      return;
    }
    
    // Validate and set dutyCycle parameter (default to 50% = 6.5s on / 6.5s off)
    const pumpDutyCycle = dutyCycle ? parseFloat(dutyCycle) : 50;
    if (isNaN(pumpDutyCycle) || pumpDutyCycle < 1 || pumpDutyCycle > 99) {
      res.send(400, "Invalid dutyCycle: must be between 1 and 99 percent");
      return;
    }
    
    // Calculate on/off times based on duty cycle
    // Use a total cycle time of 13 seconds (matching default 3s on / 10s off)
    const totalCycleTime = 13;
    const kettleOnSecs = (pumpDutyCycle / 100) * totalCycleTime;
    const kettleOffSecs = totalCycleTime - kettleOnSecs;
    
    // Start recirculation
    // Initialize temperature controller with gentler PID gains suited to the slow
    // thermal mass of a mash tun (vs. the aggressive gains used for kettle heating).
    await tempController.init(200, 0.05, 50);
    
    // Determine mash pump behavior
    let mashOnSecs = null;
    let mashOffSecs = null;
    // Note: mash pump is now synchronised with the kettle pump inside
    // startStopKettlePumpModulation — both run together to prevent volume imbalance.
    if (mashDutyCycle) {
      brewlog.warn("recirculate", "mashDutyCycle parameter ignored — mash pump is synchronised with kettle pump");
    }
    
    // Start kettle pump modulation with calculated on/off times
    const modulationResult = startStopKettlePumpModulation(kettleOnSecs, kettleOffSecs);
    if (!modulationResult.success) {
      res.send(modulationResult.status || 500, modulationResult.message);
      return;
    }
    
    // Start temperature control loop
    tempController.setMashTemp(targetTemp, (status) => {
      // Temperature control active
    });
    
    // Update recirculation state
    recirculationState = {
      active: true,
      targetTemp: targetTemp,
      dutyCycle: pumpDutyCycle,
      mashDutyCycle: mashDutyCycle ? parseFloat(mashDutyCycle) : null,
      onSecs: parseFloat(kettleOnSecs.toFixed(2)),
      offSecs: parseFloat(kettleOffSecs.toFixed(2)),
      mashOnSecs: mashOnSecs !== null ? parseFloat(mashOnSecs.toFixed(2)) : null,
      mashOffSecs: mashOffSecs !== null ? parseFloat(mashOffSecs.toFixed(2)) : null
    };
    
    res.send(200, {
      message: "Recirculation started",
      targetTemp: targetTemp,
      kettlePumpDutyCycle: pumpDutyCycle,
      kettlePumpOnSecs: kettleOnSecs.toFixed(2),
      kettlePumpOffSecs: kettleOffSecs.toFixed(2),
      mashPumpDutyCycle: mashDutyCycle ? parseFloat(mashDutyCycle) : null,
      mashPumpOnSecs: mashOnSecs !== null ? mashOnSecs.toFixed(2) : null,
      mashPumpOffSecs: mashOffSecs !== null ? mashOffSecs.toFixed(2) : null
    });
    
  } catch (error) {
    console.error(error);
    res.send(500, error.message);
  }
}

/**
 * Modulate the mash pump on/off cycling for RIMS applications.
 * Continuously cycles the pump on and off for specified durations.
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} next - Express next middleware function
 * @param {number} onSecs - Duration in seconds to keep pump on during each cycle
 * @param {number} offSecs - Duration in seconds to keep pump off during each cycle
 */
async function mashPumpModulate(req, res, next, onSecs, offSecs) {
  try {
    // If no parameters provided, stop modulation
    if (!onSecs && !offSecs) {
      if (mashPumpModulationInterval) {
        clearTimeout(mashPumpModulationInterval);
        mashPumpModulationInterval = null;
        pumps.off("Pump Mash");
        res.send(200, { message: "Mash pump modulation stopped" });
      } else {
        res.send(200, { message: "Mash pump modulation was not active" });
      }
      return;
    }
    
    // Validate parameters
    const onSecsNum = parseFloat(onSecs);
    const offSecsNum = parseFloat(offSecs);
    
    if (isNaN(onSecsNum) || isNaN(offSecsNum) || onSecsNum < 0.1 || onSecsNum > 3600 || offSecsNum < 0.1 || offSecsNum > 3600) {
      progressPublish.error(`Invalid pump modulation parameters: onSecs=${onSecs}, offSecs=${offSecs}`);
      res.send(400, "Invalid parameters: onSecs and offSecs must be numbers between 0.1 and 3600");
      return;
    }

    // Stop any existing modulation
    if (mashPumpModulationInterval) {
      clearTimeout(mashPumpModulationInterval);
      mashPumpModulationInterval = null;
      pumps.off("Pump Mash");
    }
    
    // Adjust timing for simulation speed
    const simSpeed = getSimulationSpeed();
    const adjustedOnSecs = onSecsNum / simSpeed;
    const adjustedOffSecs = offSecsNum / simSpeed;
    
    // Define the cycling function
    const cycle = () => {
      // Get current pump status (0 = off, non-zero = on)
      const pumpStatus = pumps.getStatus().find(p => p.name === "Pump Mash")?.value || 0;
      
      if (pumpStatus !== 0) {
        // Pump is on, turn it off
        pumps.off("Pump Mash");
        // Schedule next on cycle
        mashPumpModulationInterval = setTimeout(() => {
          cycle();
        }, adjustedOffSecs * 1000);
      } else {
        // Pump is off, turn it on
        pumps.on("Pump Mash");
        // Schedule next off cycle
        mashPumpModulationInterval = setTimeout(() => {
          cycle();
        }, adjustedOnSecs * 1000);
      }
    };
    
    // Start the first cycle (turn pump on)
    cycle();
    
    res.send(200, {
      message: "Mash pump modulation started",
      onSecs: onSecsNum,
      offSecs: offSecsNum
    });
    
  } catch (error) {
    console.error(error);
    res.send(500, error.message);
  }
}

/**
 * Returns an asynchronous middleware function to handle valve operations.
 *
 * @param {string} name - The name of the valve.
 * @returns {Function} An asynchronous middleware function that takes req, res, next, and openClose parameters.
 */
const getValve = (name) => async (req, res, next, openClose) => valve(req, res, next, name, openClose);

/**
 * Returns an asynchronous function that handles a request to control a pump.
 *
 * @param {string} name - The name of the pump.
 * @returns {Function} - An asynchronous function that takes in req, res, next, and onOff parameters and calls the pump function.
 */
const getPump = (name) => {
  return async (req, res, next, onOff) => {
    pump(req, res, next, name, onOff);  
  }
}

/**
 * Calculates the temperature drop the wort will experience when transferred
 * into the mash tun, accounting for two effects:
 *
 *  1. Pipe conduction loss — heat conducted through the stainless pipe wall
 *     from the hot wort to the cooler ambient air during transfer.
 *
 *  2. Vessel thermal mass — energy absorbed by the cold stainless vessel body
 *     as it heats up from ambient to the target mash temperature.
 *     For a 50 L vessel this is the dominant offset (~1-3°C depending on ΔT).
 *     Only included on the first mash step; subsequent steps find the vessel
 *     already at temperature so this term is omitted.
 *
 * @param {number}  tempFluid        - Target mash temperature (°C).
 * @param {string}  tempSensorName   - Sensor name used to read ambient temperature.
 * @param {boolean} [includeVesselMass=true] - Include vessel thermal mass offset (first step only).
 * @returns {Promise<number>}        - Combined ΔT to add to the kettle set-point.
 */
async function pipeHeatLoss(tempFluid, tempSensorName, includeVesselMass = true) {
  const tempAmbient = await therm.getTemp(tempSensorName);

  // ── Pipe conduction loss ──────────────────────────────────────────────────
  const k_ss   = 16;     // W/(m·°C)  thermal conductivity of stainless steel
  const L      = 1.76;   // m         transfer pipe length
  const r_i    = 0.0125; // m         pipe inner radius (12.5 mm → 25 mm ID)
  const r_o    = 0.0155; // m         pipe outer radius (31 mm OD)
  const C_w    = 4200;   // J/(kg·°C) specific heat of water
  const flow   = 0.200;  // kg/s      wort flow rate during transfer

  const heatLossJPerSec = 2 * Math.PI * k_ss * L * (tempFluid - tempAmbient)
                          / Math.log(r_o / r_i);
  const deltaTpipe = heatLossJPerSec / C_w / flow;

  // ── Vessel thermal mass ───────────────────────────────────────────────────
  // Only applied on the first mash step when the vessel is cold.  Subsequent
  // steps find the vessel already at mash temperature so this term is zero.
  // A 50 L stainless mash tun: ~3 kg of steel (1.5 mm wall, ~0.5 m² surface).
  const m_vessel = 3.0;  // kg         stainless steel mass of the vessel
  const c_ss     = 500;  // J/(kg·°C)  specific heat of stainless steel
  const m_wort   = 50.0; // kg         nominal wort volume (50 L ≈ 50 kg)

  const deltaTvessel = includeVesselMass
    ? (m_vessel * c_ss * (tempFluid - tempAmbient)) / (m_wort * C_w)
    : 0;

  return deltaTpipe + deltaTvessel;
}

/**
 * Executes a recirculating mash step in the brewing process.
 *
 * @param {Object} step - Object containing tempC and mins for the mash step.
 * @param {Object} options - Options object.
 * @param {number} [options.stepIndex=0] - Step index (0 = first step, affects preheat offset).
 * @returns {Function} An asynchronous function that performs the mash step.
 */
function doMashStep(step, options = {}){
  return async function(){
    try {
      const {tempC, mins} = step;
      const { stepIndex = 0 } = options;

      // Preheat always uses aggressive kettle gains — need to heat water quickly.
      await tempController.init(400, 0.3, 100);

      // On the first step the vessel is cold — include vessel thermal mass in the
      // preheat offset.  On subsequent steps the vessel is already at temperature
      // so only pipe conduction loss applies.
      const isFirstStep = stepIndex === 0;
      const deltaT = await pipeHeatLoss(tempC, "Temp Mash", isFirstStep);
      const temp = Math.trunc((tempC + deltaT)*10)/10;
      progressPublish(`Preheating to ${temp}C`);
      await tempController.setTemp(temp, 0, () => {});

      progressPublish(`Mash step recirc @ ${tempC}C for ${mins} mins`);
      // Switch to gentler mash gains now that we're controlling via the mash tun probe
      await tempController.init(200, 0.05, 50);

      // Both pumps are driven in lockstep by the kettle pump modulation cycle
      startStopKettlePumpModulation(10, 10);

      recirculationState = {
        active: true,
        targetTemp: tempC,
        dutyCycle: 50,
        mashDutyCycle: null,
        onSecs: 10,
        offSecs: 10,
        mashOnSecs: 10,
        mashOffSecs: 10
      };

      // Wait until the mash temperature is first reached before starting the hold timer.
      // secsAtTemp is incremented by setMashTemp on every tick where temp >= target.
      await new Promise(resolve => {
        tempController.setMashTemp(tempC, ({ secsAtTemp }) => {
          if (secsAtTemp > 0) resolve();
        });
      });

      progressPublish(`Mash step ${tempC}C reached — holding for ${mins} mins`);
      await delay(mins * 60);

      progressPublish(`Mash step ${tempC}C: stopping recirculation`);
      tempController.pause();
      startStopKettlePumpModulation(null, null);

      recirculationState = {
        active: false,
        targetTemp: null,
        dutyCycle: null,
        onSecs: null,
        offSecs: null,
        mashDutyCycle: null,
        mashOnSecs: null,
        mashOffSecs: null
      };

      return {
        status: 200,
        response: `Mash Step Complete: ${tempC}C for ${mins} mins`
      }
    } catch (err) { 
      progressPublish.error(`Error in mash step: ${err.message}`);
      return {
        status: 500,
        response: err.message
      }
    }
  }
}

/**
 * Handles the mash process by executing a series of mash steps.
 *
 * @async
 * @function mash
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {string} steps - A JSON string representing an array of mash steps.
 * @returns {Promise<void>} Sends a response indicating the result of the mash process.
 */
async function mash (req, res, next, stepsString) {
  const steps = JSON.parse(stepsString);  
  const stepRequests = steps.map((step, i) => doMashStep(step, { stepIndex: i }));

  const stepResponses = await promiseSerial(stepRequests);

  const errs = stepResponses.filter((val) => val.status === 500);

  if (errs.length > 0) {
    progressPublish.error(`Error in mash step: ${errs[0].response.message}`);
    res.send(500, errs[0].response.message);
    return;
  }else{
    res.send(200, "Mash Complete");
  }
};

/**
 * Fills the specified amount of litres using the fill service and sends a response.
 *
 * @async
 * @function fill
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @param {number} litres - The amount of litres to fill.
 * @returns {Promise<void>} - A promise that resolves when the fill is complete.
 */
async function fill (req, res, next, litres) {
  await fillService.timedFill(litres);
  res.send(200, "Fill Complete");
};

async function setBrewname (req, res, next, name) {
  const result = await mysqlService.setBrewname(name);
  result.err ? res.status(500).send(res.err) : res.send(200, result);
} 

const kettlePump =  getPump("Pump Kettle");
const mashPump =  getPump("Pump Mash");
const glycolPump = getPump("Pump Glycol");

async function streamLog (req, res, next) {
  try {
    const fileStream = fs.createReadStream(brewlog.filePath());
    res.setHeader('Content-Type', 'text/plain');
    fileStream.pipe(res);
  }catch (err) {
    progressPublish.error(`Error streaming log: ${err.message}`);
    res.status(500).send('Internal Server Error');
    return;
  }
};

async function deleteLogs (req, res, next, onOff) {
  const result = brewlog.deleteAllLogs();
  if (result) {
    res.send(200, "All logs deleted");
  } else {
    progressPublish.error("No logs to delete");
    res.send(404, "No logs to delete");
  }
};

module.exports = {
  boil,
  chill,
  chillWortInValve: getValve("Valve Chiller wort-in"),
  deleteLogs,
  extractor,
  fanStatus,
  ferment,
  chillWortOutValve: getValve("Valve Chiller wort-out"),
  fill,
  getBrewData,
  getInventory,
  getKettleTemp,
  getKettleVolume,
  getRecirculationStatus,
  getSimSpeed,
  getSystemStatus,
  glycolPump,
  heat,
  glycolChill,
  glycolHeat,
  i2cSet,
  k2f: kettle2fermenter,
  k2m: kettle2mashtun,
  kettleInValve: getValve("Valve Kettle-in"),
  kettlePump,
  kettlePumpModulate,
  m2k: mash2kettle,
  mash,
  mashInValve: getValve("Valve Mash-in"),
  mashPump,
  mashPumpModulate,
  pumpsStatus,
  recirculate,
  restart,
  sensorStatus,
  setBrewname,
  setKettleTemp,
  setKettleVolume,
  setSimulationSpeed,
  streamLog,
  updateDutyCycle,
  valvesStatus,
  whatsBrewing
}
