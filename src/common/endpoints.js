const temp	 	= require('../brewstack/nodeDrivers/therm/temp.js');

const pump 		= require('../brewstack/equipmentDrivers/pump/pump.js');
const fan 		= require('../brewstack/equipmentDrivers/fan/fan.js');
const flow 		= require('../brewstack/equipmentDrivers/flow/flow.js');
const valves	= require('../brewstack/equipmentDrivers/valve/valve.js');

const wdog	 	= require('../brewstack/equipmentDrivers/watchdog/wdog.js');

const brewlog   = require('./brewlog.js');

const fill 		= require('../brewstack/brewingAlgorithms/fill.js');
const k2m 		= require('../brewstack/brewingAlgorithms/k2m.js');
const m2k 		= require('../brewstack/brewingAlgorithms/m2k.js');
const k2f 		= require('../brewstack/brewingAlgorithms/k2f.js');

const tempController = require('../brewstack/processControl/tempController.js');

const kettle = require('../brewstack/equipmentDrivers/kettle/kettle.js');

const glycolFerment = require('../brewstack/brewingAlgorithms/glycol-ferment.js');
const glycolChill = require('../brewstack/brewingAlgorithms/glycol-chill.js');
const heater = require('../brewstack/equipmentDrivers/heater/heater.js');

const broker 		= require('./broker.js');

const progressPublish = broker.create("progress");

const startStop = require('./start-stop.js');

const {promiseSerial} = require('./brew-pub.js');

const common 		= require('../common.js');
const delay = require('./delay.js');

const flowTimeoutSecs = 5;
const endpoints = new Map();

let currentBrewname;

/**
 * @param {any} _reqParams
 */
function brewname(_reqParams) {
    return Promise.resolve(currentBrewname);
}

function restart(){
    return startStop.restart()
}

endpoints.set('status', getStatus);
endpoints.set('brewname', brewname);
endpoints.set('restart', restart);
endpoints.set('kettleTemp', kettleTemp);
endpoints.set('fill', fill2);
endpoints.set('k2m', () => transfer(k2m));
endpoints.set('m2k', () => transfer(m2k));
endpoints.set('k2f', () => transfer(k2f));
endpoints.set('boil', boil);
endpoints.set('ferment', ferment);
endpoints.set('chill', chill);
endpoints.set('heat', heat);
endpoints.set('mash', mash);

/**
 * @param {any} _reqParams
 */
function getStatus(_reqParams){
	return new Promise((resolve, reject) => {
		let result = {};
		//Initial status. No watchdog status since it can only return 'alive'		
		temp.getStatus(true)
		.then(tempStatus => {
			result.tempStatus = tempStatus;
			result.pumpStatus = pump.getStatus();
			result.flowStatus = flow.getStatus();
			result.wdogStatus = wdog.getStatus();
			result.fanStatus  = fan.getStatus();
			result.valveStatus= valves.getStatus();
			resolve(result);
		});
	});
}

/**
 * @param {string} reqParams
 */
function kettleTemp(reqParams){
    const {temp, mins} = JSON.parse(reqParams);

    const brewOptions = {
        sim:{
            simulate: false,
            speedupFactor: 1
        }
    }

    const P = 800;//600;
    
    return tempController.init(kettle.KETTLE_TEMPNAME, P, 0.3, 100, brewOptions)
        .then(() => tempController.setTemp(temp, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins))
        .then(tempController.stop)
        .then(() => {
            return `kettleTemp = ${temp}`
        })
        .catch(err => JSON.stringify(err));    
}

/**
 * @param {string} reqParams
 */
function fill2(reqParams){
    brewlog.debug("Fill2 start");
    
    const litres = JSON.parse(reqParams).litres;
    if ((litres > 0) && (litres < 50)) {
        return fill.timedFill({strikeLitres:litres, valveSwitchDelay: 5000}, (/** @type {any} */ x) => {
            kettle.updateVolume(1);
            progressPublish(`${x} Litres`);
        })
        .then(() => "Fill2 Complete")	
        .catch(err => JSON.stringify(err));
    }else{
        return Promise.resolve(`Invalid fill quantity`);
    }
}
/**
 * @param {{ transfer: any; min?: (options: any) => Promise<any>; }} f
 */
function transfer(f){
    brewlog.debug(`Start Transfer`);

    return f.transfer({flowTimeoutSecs})
    .then(()=>`Transfer Complete`)
    .catch((/** @type {any} */ err) => JSON.stringify(err))
}

/**
 * @param {string} reqParams
 */
function boil(reqParams){
    brewlog.debug("boil2 start");
    const {mins} = JSON.parse(reqParams);

    const brewOptions = {
        sim:{
            simulate: false,
            speedupFactor: 1
        }
    }
    const BOIL_TEMP = 98;
    const P = 500;//400;
    return tempController.init(kettle.KETTLE_TEMPNAME, P, 0.3, 100, brewOptions)
        .then(() => tempController.setTemp(BOIL_TEMP, brewOptions.sim.simulate ? (mins / brewOptions.sim.speedupFactor) : mins))
        .then(tempController.stop)
        .then(()=>"Boil Complete")	
        .catch(err => JSON.stringify(err)); 
}

/**
 * @param {string} reqParams
 */
function chill(reqParams){
    const {steps} = JSON.parse(reqParams);
    const chillSteps = () => glycolChill.chillSteps(steps);
    
    return glycolChill.start()
    .then(chillSteps)
    .then(glycolFerment.stop)
    .then(() => "Chilling Complete")	
    .catch(err => JSON.stringify(err))
}

/**
 * @param {string} reqParams
 */
function heat(reqParams){
    const {on} = JSON.parse(reqParams);
    on ? heater.forceOn() : heater.forceOff();
    return Promise.resolve(`${on}`);
}

/**
 * @param {string} reqParams
 */
function ferment(reqParams){
    const {steps} = JSON.parse(reqParams);
    const fermentSteps = () => glycolFerment.fermentSteps(steps);
    
    return glycolFerment.start()
    .then(fermentSteps)
    .then(glycolFerment.stop)
    .then(() => "Ferment Complete")	
    .catch(err => JSON.stringify(err))
}

/**
 * @param {string} reqParams
 */
function mash(reqParams){
    brewlog.debug("Mash2 start");
    const {steps} = JSON.parse(reqParams);
    
    return promiseSerial(steps.map(doMashStep))
    .then(() => "Mash Complete")	
    .catch((/** @type {any} */ err) => JSON.stringify(err)) 
}

function doMashStep({stepTemp, stepTime}){
    return () => new Promise((resolve,reject) => {
        common.pipeHeatLoss(stepTemp, "TempMash")
        .then(deltaT => {
            brewlog.info("pipe heat loss, deltaT=", deltaT);
            const temp = stepTemp + deltaT;
            kettleTemp(JSON.stringify({temp, mins:0}))
            .then(() => transfer(k2m))
            .then(delay.bind(this, stepTime * 60))
            .then(() => transfer(m2k))
            .then(resolve);
        });
    });
}


module.exports.default = endpoints;
