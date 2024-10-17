/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const { execSync } = require('child_process');

const  {brewfatherV2} = require('./common.js');
  
const axios = require('axios');
const common = require('../src/common.js');

const {sourceCode} = require('../src/brew-pub.js');
const brewdata = require('../src/brewdata.js');
const brewlog = require('../src/brewlog.js');
const startStop = require('../src/start-stop.js');
const broker = require('../src/broker.js');
const brewfather = require('../src/xxxxbrewfather.js');

//brewingAlgorithms
const fill = require('../src/brewstack/brewingAlgorithms/fillService.js');
const k2m = require('../src/brewstack/brewingAlgorithms/k2m.js');
const m2k = require('../src/brewstack/brewingAlgorithms/m2k.js');
const k2f = require('../src/brewstack/brewingAlgorithms/k2f.js');
const glycolChill = require('../src/brewstack/brewingAlgorithms/glycol-chill-service.js');
const glycolFerment = require('../src/brewstack/brewingAlgorithms/glycol-ferment-service.js');

//equipmentDrivers
const kettle = require('../src/brewstack/equipmentDrivers/kettle/kettle-service.js');
const heater = require('../src/brewstack/equipmentDrivers/heater/heater-service.js');  
const valves = require('../src/brewstack/equipmentDrivers/valve/valve-service.js');  
const pump = require('../src/brewstack/equipmentDrivers/pump/pump-service.js');  
const flow = require('../src/brewstack/equipmentDrivers/flow/flow-service.js');  
const wdog = require('../src/brewstack/equipmentDrivers/watchdog/wdog-service.js');  
const fan = require('../src/brewstack/equipmentDrivers/fan/fan-service.js');  

//processControl
const tempController = require('../src/brewstack/processControl/temp-controller-service.js');

const temp = require('../src/brewstack/nodeDrivers/therm/temp-service.js');


const progressPublish = broker.create("progress");

//Add these to an API?
const speedupFactor = 1;
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
function fillKettle(litres) {
  brewlog.debug("Fill start");

  return fill.timedFill({strikeLitres:litres, valveSwitchDelay: 5000}, (/** @type {any} */ x) => {
      kettle.updateVolume(1);
      progressPublish(`${x} Litres`);
  })
  .then(() => "Fill Complete")	
  .catch(err => JSON.stringify(err));
}

const getBrewname = async (auth) => {
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
    return response.data[0].recipe.name;
  }else {
    return new Error(`Multiple brews in progress!`);
  }
  
}



const getBatches = async () => {
  const batches = await brewfather.batches();
  if (batches) {
      return JSON.stringify(batches);
  } else {
      throw("Failed to find current batch");
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
    await tempController.init(kettle.KETTLE_TEMPNAME, 600, 0.3, 100, brewOptions);
    await tempController.setTemp(tempC, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins);
    await tempController.stop();
}    

const k2mTransfer =  (flowTimeoutSecs) => k2m.transfer({flowTimeoutSecs});
const m2kTransfer =  (flowTimeoutSecs) => m2k.transfer({flowTimeoutSecs});
const k2fTransfer = async (flowTimeoutSecs) => k2f.transfer({flowTimeoutSecs});

const boil = async (mins) => {
  await tempController.init(kettle.KETTLE_TEMPNAME, 600, 0.3, 100, brewOptions);
  await tempController.setTemp(100, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins);
  await tempController.stop();
  return `Boil Complete`;
}

const ferment = async (temp, hours) => {
  await glycolFerment.start()
  await glycolFerment.fermentSteps([{stepTemp:temp, stepTime:hours/24}]);
  await glycolFerment.stop();
  return "Ferment Complete";	
} 

const chill = async (temp, hours) => {
  await glycolChill.start()
  await glycolChill.chillSteps([{stepTemp:temp, stepTime:hours/24}]);
  await glycolFerment.stop();
  return "Chilling Complete";	
}

const heat = async (onOff) => {  
  (onOff === 'On') ? heater.forceOn() : heater.forceOff();
  return onOff;
}

function doMashStep(step){
  return async function(){
    const {tempC, mins} = JSON.parse(step);
    const deltaT = await common.pipeHeatLoss(tempC, "TempMash")
    brewlog.info("pipe heat loss, deltaT=", deltaT);
    const temp = tempC + deltaT;
    await kettleTemp({temp, mins:0});
    await k2m.transfer({flowTimeoutSecs});
    await delay(mins * 60);
    await m2k.transfer({flowTimeoutSecs});

    return {
      status: 200,
      response: `Mash Step Complete: ${tempC}C for ${mins} mins`
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
  getBatches,
  getBrewname,
  getInventory,
  getReadings,
  getStatus,
  heat,
  k2f:k2fTransfer,
  k2m:k2mTransfer,
  kettleTemp,
  m2k:m2kTransfer,
  publishCode,
  restart: startStop.restart
}