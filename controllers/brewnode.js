/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const glycol = require('../src/services/glycol-service.js');

const brewdata = require('../src/brewstack/common/brewdata.js');

const {promiseSerial} = require('../src/brewstack/common/brew-pub.js');
const k2m = require('../src/brewstack/brewingAlgorithms/k2m.js');
const m2k = require('../src/brewstack/brewingAlgorithms/m2k.js');
const k2f = require('../src/brewstack/brewingAlgorithms/k2f.js');
const sim = require('../src/sim/sim.js');
const heater = require('../src/services/heater-service.js');  
const fillService = require('../src/services/fill-service.js');

const tempController = require('../src/services/temp-controller-service.js');

const startStop = require('../src/start-stop.js');

const broker = require('../src/broker.js');

const { getAuth } = require('./common.js');

//Add these to an API?
const brewOptions = brewdata.defaultOptions();
const debug = true;
const flowTimeoutSecs = 5;

startStop.start(brewOptions, debug)
  .then(x=>console.log("started"));

const progressPublish = broker.create("progress");

async function whatsBrewing (req, res, next) {
  const auth = getAuth(req);
  const params = {
    "complete": true, 
    "status": 'Brewing'
  };  

  const config = { params, auth};
  const response = await axios.get(`${brewfatherV2}/batches`, config);
  const numBrewing = response.data.length;

  if (numBrewing === 0) {
    res.status(500);
    res.send("No brews in progress!");
  }else if (numBrewing === 1) {
    res.status(200);
    res.send(response.data[0].recipe);
  }else {
    res.status(500);
    res.send(`Multiple brews in progress!`);
  }
}

async function getInventory (req, res, next) {
  const auth = getAuth(req);
  const fermentables = await getFermentables(auth);
  const yeasts = await getYeasts(auth);
  const hops = await getHops(auth);
  const miscs = await getMiscs(auth);
  
  res.status(200);
  res.send({fermentables,hops,yeasts,miscs});
};

async function boil (req, res, next, mins) {
  const brewOptions = brewdata.defaultOptions();

  await tempController.init(600, 0.3, 100, brewOptions);
  await tempController.setTemp(100, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins);
  await tempController.stop();

  res.status(200);
  res.send(`Boil Complete`);
};

async function chill (req, res, next, profile) {
  await glycol.start()
  await glycol.doSteps(true, [{tempC:temp, mins:hours/24}]);
  await glycol.stop();

  res.status(200);
  res.send("Chilling Complete");
};

async function ferment (req, res, next, profile) {
  await glycol.start();
  await glycol.doSteps(false, profile);
  await glycol.stop();
  res.status(200);
  res.send("Ferment Complete");
};

async function kettle2fermenter (req, res, next, flowTimeoutSecs) {
  const result = await k2f.transfer({flowTimeoutSecs});
  res.status(200);
  res.send(result);
};

async function kettle2mashtun (req, res, next, flowTimeoutSecs) {
  const result = await k2m.transfer(flowTimeoutSecs)
  res.status(200);
  res.send(result);
};

async function mash2kettle (req, res, next, flowTimeoutSecs) {
  const result = await m2k.transfer(flowTimeoutSecs)
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
async function setKettleTemp (req, res, next, tempC, mins) {
  await tempController.init(800, 0.3, 100, brewOptions);
  await tempController.setTemp(tempC, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins);
  await tempController.stop();
  
  res.status(200);
  res.send(`Kettle reached ${tempC}`);
};


const { KETTLE_TEMPNAME } = require('../src/services/kettle-service.js');
const tempService = require('../src/services/temp-service.js');
async function getKettleTemp (req, res, next) {
  const result = await tempService.getTemp(KETTLE_TEMPNAME);
  res.status(200);
  res.send(`${result}`);
};

async function getKettleVolume (req, res, next) {
  const litres = sim.getKettleVolume();
  res.status(200);
  res.send(`${litres}`);
};

async function setKettleVolume (req, res, next, litres) {
  sim.setKettleVolume(litres);
  res.status(200);
  res.send(`Simulated kettle volume set to ${litres} litres`);
};

async function restart (req, res, next) {
  await startStop.restart();
  res.status(200);
  res.send("Restarted server");
};

async function getStatus (req, res, next) {
  const result = {
    tempStatus: await temp.getStatus(true),
    pumpStatus: pump.getStatus(),
    flowStatus: flow.getStatus(),
    wdogStatus: wdog.getStatus(),
    fanStatus: fan.getStatus(),
    valveStatus: valves.getStatus()
  }

  res.status(200);
  res.send(result);
};

async function heat (req, res, next, onOff) {
  (onOff === 'On') ? heater.forceOn() : heater.forceOff(); 
  res.status(200);
  res.send(onOff);
};

//Temp loss for a fixed flow rate
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
      const {tempC, mins} = JSON.parse(step);
      const deltaT = await pipeHeatLoss(tempC, "TempMash");
      const temp = tempC + deltaT;
      await kettleTemp({tempC:temp, mins:0});
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
        response: err
      }
    }
  }
}

async function mash (req, res, next, steps) {
  const stepRequests = steps.map(doMashStep);
  
  const stepResponses = await promiseSerial(stepRequests);

  const errs = stepResponses.filter((val) => val.status === 500);

  if (errs.length > 0) {
    res.status(500);
    res.send(errs[0].response);
    return;
  }else{
    res.status(200);
    res.send("Mash Complete");
  }
};

async function fill (req, res, next, litres) {
  await fillService.timedFill({
    strikeLitres: litres, 
    valveSwitchDelay: 5000
  }, (x) => {
      progressPublish(`${x} Litres`);
  });
  res.status(200);
  res.send("Fill Complete");
};


module.exports = {
  boil,
  chill,
  ferment,
  fill,
  getInventory,
  getStatus,
  heat,
  getKettleTemp,
  setKettleTemp,
  mash,
  m2k: mash2kettle,
  k2f: kettle2fermenter,
  k2m: kettle2mashtun,
  restart,
  getKettleVolume,
  setKettleVolume,
  whatsBrewing
}