const i2c 		= require('./services/i2c_raspi-service.js');
const pumps 	= require('./services/pump-service.js');
// const flow 		= require('./services/flow-service.js');
const fan 		= require('./services/fan-service.js');
const valves 	= require('./services/valve-service.js');
const wdog 		= require('./services/wdog-service.js');
const temp 		= require('./services/temp-service.js');
const glycolHeater = require('./services/glycol-heater-service.js');
const glycolChiller = require('./services/glycol-chiller-service.js');
const glycol 	= require('./services/glycol-service.js');
const fill 		= require('./services/fill-service.js');
const kettleHeater 	= require('./services/kettle-heater-service.js');
const tempController 	= require('./services/temp-controller-service.js');
const {getSimulationSpeed, setSimulationSpeed} = require('./sim/sim.js');

const brewdefs = require('../src/brewstack/common/brewdefs.js');

const sim 		= require('./sim/sim.js');
const broker 	= require('./broker.js');
const brewfatherService = require('./services/brewfather-service.js');
const brewlog = require('./brewstack/common/brewlog.js');

async function start() {
	brewlog.info("Starting BrewNode services...");
	const NO_SIMULATION = 1;

	const simulationSpeed = brewdefs.isRaspPi() ? NO_SIMULATION : 10;
	setSimulationSpeed(simulationSpeed);

	try {
		await i2c.start(simulationSpeed);
		await temp.start(simulationSpeed);
	}catch(err){
		console.log(err.message);
		return false;
	}

	await pumps.start();
	await fan.start();
	await valves.start(simulationSpeed);
	await wdog.start();
	// try{
	// 	await flow.start(simulationSpeed);
	// }catch(err){
	// 	console.log(err.message);
	// }
	await kettleHeater.start(simulationSpeed);
	await glycolHeater.start();
	await glycolChiller.start();
	try{
		await glycol.start(simulationSpeed);
	}catch(err){
		console.log(err.message);
	}

	await brewfatherService.start(15/simulationSpeed);

	await fill.start(simulationSpeed);
	try{
		await tempController.start(simulationSpeed);
	}catch(err){
		console.log(err.message);
	}

	await sim.start(simulationSpeed);

	return true;
}

async function stop() {
	brewlog.warn("Shutting down BrewNode services...");
	broker.destroy('log');

	// brewfather.stop();
	tempController.stop();

	await brewfatherService.stop();
	await glycol.stop();
	await glycolChiller.stop();
	await fill.stop();
	await sim.stop();

	await kettleHeater.stop();
	await glycolHeater.stop();

	await pumps.stop();
	await temp.stop();
	await fan.stop();
	await valves.stop();
	await wdog.stop();
	// await flow.stop();

}

module.exports = {
	restart: async () => {
		await stop();
		await start();
	},
	/**
 	 * @desc Start entire system
	*/
	start,
	
	/**
	 * @desc Stop entire system
	 */
	stop
}

