const i2c 		= require('./brewstack/nodeDrivers/i2c/i2c_raspi-service.js');
const pump 		= require('./brewstack/equipmentDrivers/pump/pump-service.js');
const flow 		= require('./brewstack/equipmentDrivers/flow/flow-service.js');
const fan 		= require('./brewstack/equipmentDrivers/fan/fan-service.js');
const valves 	= require('./brewstack/equipmentDrivers/valve/valve-service.js');
const wdog 		= require('./brewstack/equipmentDrivers/watchdog/wdog-service.js');
const temp 		= require('./brewstack/nodeDrivers/therm/temp-service.js');
const kettle 	= require('./brewstack/equipmentDrivers/kettle/kettle-service.js');
const mashtun 	= require('./brewstack/equipmentDrivers/mashtun/mashtun-service.js');
const glycolHeater = require('./brewstack/equipmentDrivers/glycol/glycol-heater-service.js');
const glycolChill 	= require('./brewstack/brewingAlgorithms/glycol-chill-service.js');
const fill 				= require('./brewstack/brewingAlgorithms/fillService.js');
const tempController 	= require('./brewstack/processControl/temp-controller-service.js');
const glycolFerment 	= require('./brewstack/brewingAlgorithms/glycol-ferment-service.js');
const brewfather 	= require('./brewfather-service.js');

// const brewmon = require('./brewmon.js');

const sim 		= require('./sim/sim.js');
const brewlog 	= require('./brewlog.js');

const broker 	= require('./broker.js');

let _speedupFactor;
let _brewOptions;
let _debug;
let publishLog;

async function start(speedupFactor = _speedupFactor, brewOptions = _brewOptions, debug = _debug) {
	return new Promise((resolve, reject) => {
		_speedupFactor = speedupFactor;
		_brewOptions = brewOptions;
		_debug = debug;
	
		if (speedupFactor) {
			brewlog.debug('Simulating...');
			brewOptions.sim.simulate = true;
			brewOptions.sim.speedupFactor = speedupFactor;
		}
		
		
		publishLog = broker.create('log'); 
		brewlog.startSync(brewOptions, publishLog, debug);

		// brewfather.start();

		i2c.start(brewOptions)
		// .then(brewmon.start)
		.then(temp.start)
		.then(brewfather.start) //must come after temp.start
		.then(pump.start)
		.then(fan.start)
		.then(valves.start)
		.then(wdog.start)
		.then(flow.start)
		.then(kettle.start)
		.then(glycolHeater.start)
		.then(glycolFerment.start)
		.then(glycolChill.start)	
		.then(mashtun.start)
		.then(fill.start)
		.then(tempController.start)
		.then(sim.start.bind(this, brewOptions))
		.then((r)=>{
			resolve(brewOptions);
		}, (err) => {
			reject(()=>brewlog.error("start error", err));
		})
		.catch(err => {
			brewlog.error("start error", err)
		});
	})
}

function stop(opt) {
	broker.destroy('log');

	brewfather.stop();

	return pump.stop()
	.then(temp.stop)
	.then(fan.stop)
	.then(valves.stop)
	.then(wdog.stop)
	.then(flow.stop)
	.then(kettle.stop)
	.then(mashtun.stop)
	.then(glycolHeater.stop)
	.then(glycolFerment.stop)
	.then(glycolChill.stop)
	// .then(brewfather.stop)
	.then(fill.stop)
	.then(sim.stop)
	.then(tempController.stop)
	// .then(brewmon.stop)
	.catch(err => {brewlog.error("stop error", err);});
}
module.exports = {
	restart: () => stop().then(start),
	/**
 	 * @desc Start entire system
	*/
	start,
	
	/**
	 * @desc Stop entire system
	 */
	stop
}

