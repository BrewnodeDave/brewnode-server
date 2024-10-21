/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const { execSync } = require('child_process');

const  {brewfatherV2,} = require('./common.js');
  
const axios = require('axios');
const {delay} = require('../src/sim/sim.js');

const {sourceCode} = require('../src/brewstack/common/brew-pub.js');
const brewdata = require('../src/brewstack/common/brewdata.js');
const brewlog = require('../src/brewstack/common/brewlog.js');
const startStop = require('../src/start-stop.js');
const broker = require('../src/broker.js');
const brewfather = require('../src/services/brewfather-service.js');

//brewingAlgorithms
const k2m = require('../src/brewstack/brewingAlgorithms/k2m.js');
const m2k = require('../src/brewstack/brewingAlgorithms/m2k.js');
const k2f = require('../src/brewstack/brewingAlgorithms/k2f.js');

//equipmentDrivers
const glycol = require('../src/services/glycol-service.js');
const fill = require('../src/services/fill-service.js');
const kettle = require('../src/services/kettle-service.js');
const heater = require('../src/services/heater-service.js');  
const valves = require('../src/services/valve-service.js');  
const pump = require('../src/services/pump-service.js');  
const flow = require('../src/services/flow-service.js');  
const wdog = require('../src/services/wdog-service.js');  
const fan = require('../src/services/fan-service.js');  

//processControl
const tempController = require('../src/services/temp-controller-service.js');

const temp = require('../src/services/temp-service.js');

const sim = require('../src/sim/sim.js');

const progressPublish = broker.create("progress");

//Add these to an API?
const speedupFactor = 10;
const brewOptions = brewdata.defaultOptions();
const debug = true;
const flowTimeoutSecs = 5;

startStop.start(speedupFactor, brewOptions, debug)
  .then(x=>console.log("started"));

/**
 * Fill
 *
 * litres Integer Fill litres
 * no response value expected for this operation
 **/
async function fillKettle(litres) {
  brewlog.debug("Fill start");

  await fill.timedFill({strikeLitres:litres, valveSwitchDelay: 5000}, (x) => {
      kettle.updateVolume(1);
      progressPublish(`${x} Litres`);
  })
  return "Fill Complete";	
}

const whatsBrewing = async (auth) => {
  const params = {
    "complete": true, 
    "status": 'Brewing'
  };  

  const config = { params, auth};
  const response = await axios.get(`${brewfatherV2}/batches`, config);

  const numBrewing = response.data.length;

  if (numBrewing === 0) {
    return new Error("No brews in progress!");
  }else if (numBrewing === 1) {
    return response.data[0].recipe;
  }else {
    return new Error(`Multiple brews in progress!`);
  }
  
}

const getReadings = async (batchId) => {
  const readings = await brewfather.batchReadings(batchId);
  if (readings) {
      return JSON.stringify(readings);
  } else {
      throw("Failed to find current batch");
  }
}

const kettleTemp = async ({tempC, mins}) => {
    await tempController.init(800, 0.3, 100, brewOptions);
    await tempController.setTemp(tempC, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins);
    await tempController.stop();
}    

const k2mTransfer =  (flowTimeoutSecs) => k2m.transfer({flowTimeoutSecs});
const m2kTransfer =  (flowTimeoutSecs) => m2k.transfer({flowTimeoutSecs});
const k2fTransfer = async (flowTimeoutSecs) => k2f.transfer({flowTimeoutSecs});

const boil = async (mins) => {
  await tempController.init(600, 0.3, 100, brewOptions);
  await tempController.setTemp(100, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins);
  await tempController.stop();
  return `Boil Complete`;
}

const ferment = async (temp, hours) => {
  await glycol.start()
  await glycol.doSteps(false, [{tempC:temp, mins:hours/24}]);
  await glycol.stop();
  return "Ferment Complete";	
} 

const chill = async (temp, hours) => {
  await glycol.start()
  await glycol.doSteps(true, [{tempC:temp, mins:hours/24}]);
  await glycol.stop();
  return "Chilling Complete";	
}

const heat = async (onOff) => {  
  (onOff === 'On') ? heater.forceOn() : heater.forceOff();
  return onOff;
}


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

async function getFermentables(auth){
  const config = { auth };
  const response = await axios.get(`${brewfatherV2}/inventory/fermentables`, config);

  return response.data.map((x) => ({
    supplier:x.supplier, 
    name:x.name, 
    inventory:x.inventory
  }));
}

async function getYeasts(auth){
  const params = {
    inventory_exists: true,
    complete:true,
    limit:999
  }

  const config = { params, auth };
  const response = await axios.get(`${brewfatherV2}/inventory/yeasts`, config);

  return response.data.map((x) => ({
    supplier:x.supplier, 
    name:x.name, 
    inventory:x.inventory
  }));
}

async function getHops(auth){
  const params = {
    inventory_exists: true,
    complete:true,
    limit:999
  }

  const config = { params, auth };
  const response = await axios.get(`${brewfatherV2}/inventory/hops`, config);

  return response.data.map(x=>({
    type:x.type, 
    name:x.name, 
    inventory:x.inventory, 
    unit:x.unit}));
}
async function getMiscs(auth){
  const params = {
    inventory_exists: true,
    complete:true,
    limit:999
  }

  const config = { params, auth };
  const response = await axios.get(`${brewfatherV2}/inventory/miscs`, config);

  return response.data.map(x=>({
    name:x.name, 
    inventory:x.inventory, 
    unit:x.unit
  }));
}

const getInventory = async (auth) => {  
  
  const fermentables = await getFermentables(auth);
  const yeasts = await getYeasts(auth);
  const hops = await getHops(auth);
  const miscs = await getMiscs(auth);
  
  return {fermentables,hops,yeasts,miscs};        
}

const publishCode = () => {
		execSync("jsdoc -c conf.json -t ./node_modules/ub-jsdoc");
		
		const config = {
			host: process.env.BREWNODE_HOST, 
			port: process.env.BREWNODE_PORT,
			user: process.env.BREWNODE_FTPUSER, 
			password: process.env.BREWNODE_FTPPASSWORD, 
			wpUser: process.env.BREWNODE_WPUSER, 
			wpPassword: process.env.BREWNODE_WPPASSWORD
		};

    sourceCode(config).then(err => {
			if (err.errors.length) {
				brewlog.error(err.errors);
			} else {
				brewlog.info(`Published!`);
			}
		}, reason => {
			console.log(reason);
		});
}

async function getStatus(){
		let result = {};
    result.tempStatus = await temp.getStatus(true);
    result.pumpStatus = pump.getStatus();
    result.flowStatus = flow.getStatus();
    result.wdogStatus = wdog.getStatus();
    result.fanStatus  = fan.getStatus();
    result.valveStatus= valves.getStatus();

    return result;
}

module.exports = {
  boil,
  chill,
  doMashStep,
  ferment,
  fill:fillKettle,
  whatsBrewing,
  getInventory,
  getReadings,
  getStatus,
  heat,
  k2f:k2fTransfer,
  k2m:k2mTransfer,
  kettleTemp,
  m2k:m2kTransfer,
  publishCode,
  restart: startStop.restart,
  setKettleVolume:sim.setKettleVolume
}