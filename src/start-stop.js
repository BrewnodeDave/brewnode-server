const i2c 		= require('./services/i2c_raspi-service.js');
const pump 		= require('./services/pump-service.js');
const flow 		= require('./services/flow-service.js');
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
const {getSimulationSpeed} = require('./sim/sim.js');

const sim 		= require('./sim/sim.js');
const broker 	= require('./broker.js');
const brewfatherService = require('./services/brewfather-service.js');

async function start() {

	publishLog = broker.create('log'); 

	const simulationSpeed = getSimulationSpeed();

	await i2c.start(simulationSpeed);
	try {
		await temp.start(simulationSpeed)
	}catch(err){
		console.log(err.message);
	}

	await pump.start();
	await fan.start();
	await valves.start(simulationSpeed);
	await wdog.start();
	try{
		await flow.start(simulationSpeed);
	}catch(err){
		console.log(err.message);
	}
	await kettleHeater.start(simulationSpeed);
	await glycolHeater.start();
	await glycolChiller.start();
	try{
		await glycol.start(simulationSpeed);
	}catch(err){
		console.log(err.message);
	}

	// await brewfatherService.start();

	await fill.start(simulationSpeed);
	try{
		await tempController.start(simulationSpeed);
	}catch(err){
		console.log(err.message);
	}

	await sim.start(simulationSpeed);

	return ;
}

async function stop() {
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

	await pump.stop();
	await temp.stop();
	await fan.stop();
	await valves.stop();
	await wdog.stop();
	await flow.stop();

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

