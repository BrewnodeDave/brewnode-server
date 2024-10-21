const i2c 		= require('./services/i2c_raspi-service.js');
const pump 		= require('./services/pump-service.js');
const flow 		= require('./services/flow-service.js');
const fan 		= require('./services/fan-service.js');
const valves 	= require('./services/valve-service.js');
const wdog 		= require('./services/wdog-service.js');
const temp 		= require('./services/temp-service.js');
const kettle 	= require('./services/kettle-service.js');
const mashtun 	= require('./services/mashtun-service.js');
const glycolHeater = require('./services/glycol-heater-service.js');
const glycol 	= require('./services/glycol-service.js');
const fill 		= require('./services/fill-service.js');
const tempController 	= require('./services/temp-controller-service.js');
const brewfather = require('./services/brewfather-service.js');

// const brewmon = require('./brewmon.js');

const sim 		= require('./sim/sim.js');
const brewlog 	= require('./brewstack/common/brewlog.js');

const broker 	= require('./broker.js');

let _speedupFactor;
let _brewOptions;
let _debug;
let publishLog;

async function start(speedupFactor = _speedupFactor, brewOptions = _brewOptions, debug = _debug) {
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

	await i2c.start(brewOptions)//sim.simulate
	// .then(brewmon.start)
	brewOptions.ambientTemp = await temp.start(brewOptions)//sim.speedupFactor, sim.ambientTemp => ambientTemp
	await brewfather.start(brewOptions) // recipeName //must come after temp.start
	await pump.start(brewOptions)//
	await fan.start(brewOptions)//
	await valves.start(brewOptions)//valveSwitchDelay
	await wdog.start(brewOptions)//
	await flow.start(brewOptions)// sim.simulate, sim.speedupFactor, flowReportSecs
	await kettle.start(brewOptions)//
	await glycolHeater.start(brewOptions)//
	await glycol.start(brewOptions)//
	await mashtun.start(brewOptions)//
	await fill.start(brewOptions)
	await tempController.start(brewOptions)
	await sim.start(brewOptions)

	return 	brewOptions;
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
	.then(glycol.stop)
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

