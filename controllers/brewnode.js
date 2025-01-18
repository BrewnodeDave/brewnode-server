/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';
const { KETTLE_TEMPNAME } = require('../src/services/kettle-service.js');
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
const flow = require('../src/services/flow-service.js');
const wdog = require('../src/services/wdog-service.js');
const fan = require('../src/services/fan-service.js');
const temp = require('../src/services/temp-service.js');
const valves = require('../src/services/valve-service.js');
const tempController = require('../src/services/temp-controller-service.js');
const startStop = require('../src/start-stop.js');
const {progressPublish, remainingMashMinutes, remainingBoilMinutes, remainingKettleMinutes} = require('../src/broker.js');

const axios = require('axios');
const { brewfatherV2, getAuth } = require('./common.js');
const mysqlService = require('../src/services/mysql-service.js');
const {getSimulationSpeed} = require('../src/sim/sim.js');

const flowTimeoutSecs = 5;

async function whatsBrewing (req, res, next) {
  const auth = getAuth(req);
  const params = {
    "complete": true, 
    "status": 'Brewing',
  };  
  
  const config = { params, auth};  
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
      }else {
        progressPublish(response.data[0].recipe.name);
        res.send(200, response.data[0].recipe);
      }
  }else if (numBrewing === 1) {
    progressPublish(response.data[0].recipe.name);
    res.send(200, response.data[0].recipe);
  }else {
    res.send(400, `Multiple brews in progress!`);
  }
}

async function getBrewData (req, res, next) {
  try {
    const response = await mysqlService.getBrewData(req.query.brewname);
    res.send(200, response);
  }catch (err) {
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
      res.send(429, `Too many requests. Please retry after ${retryAfterSeconds} seconds.`);
    } else {
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

  progressPublish(``);
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
  const result = await tempService.getTemp(KETTLE_TEMPNAME);
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
  res.send(200, `${factor}`);
};

async function setSimulationSpeed (req, res, next, factor) {
  sim.setSimulationSpeed(factor);
  res.send(200, `Simulated speed factor = ${factor}.`);
};

async function restart (req, res, next) {
  await startStop.restart();
  res.send(200, "Restarted server");
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

    switch(req.query.name){
      case "ValveKettleIn":
        result = valves.getStatus().find(v => v.name === "ValveKettleIn").value;
        break; 
      case "ValveMashIn": 
        result = valves.getStatus().find(v => v.name === "ValveMashIn").value;
        break;
      case "ValveChillWortIn":
        result = valves.getStatus().find(v => v.name === "ValveChillWortIn").value;
        break;
      case "ValveFermentIn":
        result = valves.getStatus().find(v => v.name === "ValveFermentIn").value;
        break;
      case "PumpKettle":
        result = pumps.getStatus().find(p => p.name === "PumpKettle").value;
        break;
      case "PumpMash":
        result = pumps.getStatus().find(p => p.name === "PumpMash").value;
        break;
      case "PumpGlycol":
        result = pumps.getStatus().find(p => p.name === "PumpGlycol").value;
        break;
      case "Watchdog":
        result = wdog.getStatus();
        break;
      case "Fan":
        result = fan.getStatus();
        break;
      case "GlycolHeater":
        result = glycolHeater.getStatus();
        break;
      case "GlycolChiller":
        result = glycolChiller.getStatus();
        break;
      case "Heater":
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
      case "TempKettle":
        f = await temp.getStatus();
        result = f.find(t => t.name === "TempKettle").value;
        break;
      case "TempMash":
        f = await temp.getStatus();
        result = f.find(t => t.name === "TempMash").value;
        break;    
      case "TempFermenter":
        f = await temp.getStatus();
        result = f.find(t => t.name === "TempFermenter").value;
        break;
      case "TempGlycol":
        f = await temp.getStatus();
        result = f.find(t => t.name === "TempGlycol").value;
        break
      case "All":
        const tempStatus = await temp.getStatus();
        result.push(tempStatus.flat());
        result.push(pumps.getStatus().flat());
        result.push(flow.getStatus().flat());
        result.push(wdog.getStatus());
        result.push(fan.getStatus());
        result.push(glycolHeater.getStatus());
        result.push(glycolChiller.getStatus());
        result.push(kettleHeater.getStatus());
        result.push(valves.getStatus().flat());

        result = result.flat();
        break;
      default:
        console.error(`Unknown sensor name: ${req.query.name}`);
        res.send(400, `Unknown sensor name: ${req.query.name}`);
        return;
    }

    res.status(200).json(result);
  } catch (error) {
    console.error('Error getting status:', error);
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
    console.error('Error getting status:', error);
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
    console.error('Error getting status:', error);
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
    console.error('Error getting status:', error);
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
 * Calculates the heat loss in a pipe and returns the temperature difference.
 *
 * @param {number} tempFluid - The temperature of the fluid inside the pipe.
 * @param {string} tempSensorName - The name of the temperature sensor to get the ambient temperature.
 * @returns {Promise<number>} - The temperature difference due to heat loss.
 */
async function pipeHeatLoss(tempFluid, tempSensorName) {
  const tempAmbient = await therm.getTemp(tempSensorName)
  const k = 16;// W/mC the heat transfer coefficient of stainless steel
  const L = 1.76;//0.35;//1.32;//1.76;//the length of pipe
  const innerDiameter = 12.5;//0.022;
  const outerDiameter = 31;//0.027;
  const flowRate = 0.200;

  const C = 4200; //Sepcific heat capacity of water
  const heatLossJPerSec = 2 * Math.PI * k * L * (tempFluid - tempAmbient) / (Math.log(outerDiameter / innerDiameter));

  const k2 = 18 / (60 - 18);
  const empiricalDeltaTemp = k2 * (tempFluid - tempAmbient);

  const deltaTemp = heatLossJPerSec / C / flowRate;
  
  return deltaTemp;
}

/**
 * Executes a mash step in the brewing process.
 *
 * @param {string} step - A JSON string containing the temperature in Celsius and the duration in minutes for the mash step.
 * @returns {Function} An asynchronous function that performs the mash step.
 *
 * The returned function performs the following actions:
 * 1. Parses the input step to extract temperature and duration.
 * 2. Calculates the temperature loss in the pipe.
 * 3. Logs the temperature loss.
 * 4. Sets the kettle temperature.
 * 5. Transfers the liquid from kettle to mash tun.
 * 6. Waits for the specified duration.
 * 7. Transfers the liquid back from mash tun to kettle.
 * 8. Returns an object indicating the completion status and details of the mash step.
 */
function doMashStep(step){
  return async function(){
    try {
      const {tempC, mins} = step;
      const deltaT = await pipeHeatLoss(tempC, "TempMash");
      const temp = tempC + deltaT;
      await tempController.setTemp(
        temp, 
        (getSimulationSpeed() !== 1)
          ? (mins / getSimulationSpeed()) 
          : mins,
        remainingMashMinutes);

      await k2m.transfer({flowTimeoutSecs});
      await delay(mins * 60);
      await m2k.transfer({flowTimeoutSecs});

      return {
        status: 200,
        response: `Mash Step Complete: ${tempC}C for ${mins} mins`
      }
    } catch (err) { 
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
async function mash (req, res, next, steps) {
  const stepRequests = JSON.parse(steps).map(doMashStep);
  
  const stepResponses = await promiseSerial(stepRequests);

  const errs = stepResponses.filter((val) => val.status === 500);

  if (errs.length > 0) {
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
  progressPublish(name);
  result.err ? res.status(500).send(res.err) : res.send(200, result);
} 

const kettlePump =  getPump("PumpKettle");
const mashPump =  getPump("PumpMash");
const glycolPump = getPump("PumpGlycol");


module.exports = {
  boil,
  chill,
  chillWortInValve: getValve("ValveChillWortIn"),
  extractor,
  fanStatus,
  ferment,
  fermentInValve: getValve("ValveFermentIn"),
  fill,
  getBrewData,
  getInventory,
  getKettleTemp,
  getKettleVolume,
  getSimSpeed,
  glycolPump,
  heat,
  glycolChill,
  glycolHeat,
  k2f: kettle2fermenter,
  k2m: kettle2mashtun,
  kettleInValve: getValve("ValveKettleIn"),
  kettlePump,
  m2k: mash2kettle,
  mash,
  mashInValve: getValve("ValveMashIn"),
  mashPump,
  pumpsStatus,
  restart,
  sensorStatus,
  setBrewname,
  setKettleTemp,
  setKettleVolume,
  setSimulationSpeed,
  valvesStatus,
  whatsBrewing
}
