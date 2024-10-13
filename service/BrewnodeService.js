'use strict';

const { execSync } = require('child_process');
const {sourceCode} = require('../src/common/brew-pub.js');

const common = require('../src/common.js');

const brewdata = require('../src/common/brewdata.js');
const brewlog = require('../src/common/brewlog.js');
const brewmon = require('../src/common/brewmon.js');
const startStop = require('../src/common/start-stop.js');
const broker = require('../src/common/broker.js');
const brewfather = require('../src/common/brewfather.js');

const fill = require('../src/brewstack/brewingAlgorithms/fill.js');

const kettle = require('../src/brewstack/equipmentDrivers/kettle/kettle.js');
const heater = require('../src/brewstack/equipmentDrivers/heater/heater.js');  

const tempController = require('../src/brewstack/processControl/tempController.js');

const k2m = require('../src/brewstack/brewingAlgorithms/k2m.js');
const m2k = require('../src/brewstack/brewingAlgorithms/m2k.js');
const k2f = require('../src/brewstack/brewingAlgorithms/k2f.js');
const glycolChill = require('../src/brewstack/brewingAlgorithms/glycol-chill.js');
const glycolFerment = require('../src/brewstack/brewingAlgorithms/glycol-ferment.js');


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
exports.fill = function(litres) {
  brewlog.debug("Fill start");

  return fill.timedFill({strikeLitres:litres, valveSwitchDelay: 5000}, (/** @type {any} */ x) => {
      kettle.updateVolume(1);
      progressPublish(`${x} Litres`);
  })
  .then(() => "Fill Complete")	
  .catch(err => JSON.stringify(err));
}

/**
 * Get current status
 *
 * returns Status
 **/
exports.getStatus = () => brewmon.getStatus(true);


//# GET endpoints.set('brewname', brewname()=>string);
exports.getBrewname = async () => {
  const batches = await brewfather.get("batches", { status: 'Brewing', complete: true });
  if (batches[0]) {
      return JSON.stringify(batches[0].recipe.name);
  } else {
      throw("Failed to find current batch");
  }
}

exports.getBatches = async () => {
  const batches = await brewfather.batches();
  if (batches) {
      return JSON.stringify(batches);
  } else {
      throw("Failed to find current batch");
  }
}

exports.getReadings = async (batchId) => {
  const readings = await brewfather.batchReadings(batchId);
  if (readings) {
      return JSON.stringify(readings);
  } else {
      throw("Failed to find current batch");
  }
}

exports.restart = startStop.restart;

exports.kettleTemp = async (temp, mins) => {
  return tempController.init(kettle.KETTLE_TEMPNAME, 600, 0.3, 100, brewOptions)
     .then(() => {
       return tempController.setTemp(temp, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins)
       .then(tempController.stop)
       .then(() => {
          return `kettleTemp = ${temp}`;
       })
     })
   .catch(err => {throw(err)});
}    

exports.k2m = async (flowTimeoutSecs) => k2m.transfer({flowTimeoutSecs});
exports.m2k = async (flowTimeoutSecs) => m2k.transfer({flowTimeoutSecs});
exports.k2f = async (flowTimeoutSecs) => k2f.transfer({flowTimeoutSecs});


exports.boil = async (mins) => {
  return tempController.init(kettle.KETTLE_TEMPNAME, 600, 0.3, 100, brewOptions)
     .then(() => {
       return tempController.setTemp(100, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins)
       .then(tempController.stop)
       .then(() => {
          return `Boil Complete`;
       })
     })
   .catch(err => {throw(err)});
}


// # PUT endpoints.set('ferment', ferment([{stepTemp, stepTime}));
exports.ferment = async (temp, hours) => {
  const fermentSteps = () => glycolFerment.fermentSteps([{stepTemp:temp, stepTime:hours/24}]);
  
  return glycolFerment.start()
  .then(fermentSteps)
  .then(glycolFerment.stop)
  .then(() => "Ferment Complete")	
  .catch(err => JSON.stringify(err))

} 

exports.chill = async (temp, hours) => {
  const chillSteps = () => glycolChill.chillSteps([{stepTemp:temp, stepTime:hours/24}]);

  return glycolChill.start()
  .then(chillSteps)
  .then(glycolFerment.stop)
  .then(() => "Chilling Complete")	
  .catch(err => JSON.stringify(err))
}

exports.heat = async (on) => {  
  on ? heater.forceOn() : heater.forceOff();
  return Promise.resolve(`${on}`);
}

// # PUT endpoints.set('mash', mash([{stepTemp, stepTime}]));
function doMashStep({stepTemp, stepTime}){
  return () => new Promise((resolve,reject) => {
      common.pipeHeatLoss(stepTemp, "TempMash")
      .then(deltaT => {
          brewlog.info("pipe heat loss, deltaT=", deltaT);
          const temp = stepTemp + deltaT;
          kettleTemp(JSON.stringify({temp, mins:0}))
          .then(k2m.transfer(flowTimeoutSecs))
          .then(delay.bind(this, stepTime * 60))
          .then(m2k.transfer(flowTimeoutSecs))
          .then(resolve);
      });
  });
}
exports.mash = async (temp, mins) => {
  brewlog.debug("Mash start");  
  const steps = [{stepTemp:temp, stepTime:mins}];
  return promiseSerial(steps.map(doMashStep))
  .then(() => "Mash Complete")	
  .catch((/** @type {any} */ err) => JSON.stringify(err)) 
}

exports.getInventory = async () => {  
  const fermentables = await brewfather.fermentables();
  const yeasts = await brewfather.yeasts();
  const hops = await brewfather.hops();
  const miscs = await brewfather.miscs();
  
  return {fermentables,hops,yeasts,miscs};        
}

exports.publishCode = () => {
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