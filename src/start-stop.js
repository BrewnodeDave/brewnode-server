const i2c 		= require('./services/i2c_raspi-service.js');
const pump 		= require('./services/pump-service.js');
const flow 		= require('./services/flow-service.js');
const fan 		= require('./services/fan-service.js');
const valves 	= require('./services/valve-service.js');
const wdog 		= require('./services/wdog-service.js');
const temp 		= require('./services/temp-service.js');
const glycolHeater = require('./services/glycol-heater-service.js');
const glycol 	= require('./services/glycol-service.js');
const fill 		= require('./services/fill-service.js');
const kettleHeater 	= require('./services/kettle-heater-service.js');
const tempController 	= require('./services/temp-controller-service.js');
const mysql		 = require('./services/mysql-service.js');
const {getSimulationSpeed} = require('./sim/sim.js');

const sim 		= require('./sim/sim.js');
const broker 	= require('./broker.js');

async function start() {

	publishLog = broker.create('log'); 

	const simulationSpeed = getSimulationSpeed();

	await i2c.start();
	await temp.start(simulationSpeed)

	//This only needs to be done during fermentation 
	//and should a client api be created for this?
	// await brewfather.start(recipeName);//must come after temp.start

	await mysql.start();
	await pump.start();
	await fan.start();
	await valves.start(simulationSpeed);
	await wdog.start();
	await flow.start(simulationSpeed);
	await kettleHeater.start(simulationSpeed);
	await glycolHeater.start();
	await glycol.start(simulationSpeed);
	await fill.start(simulationSpeed);
	await temp.start(simulationSpeed);
	await tempController.start(simulationSpeed);
	await sim.start(simulationSpeed);

	return ;
}

async function stop() {
	broker.destroy('log');

	// brewfather.stop();

	await mysql.stop();
	await pump.stop();
	await temp.stop();
	await fan.stop();
	await valves.stop();
	await wdog.stop();
	await flow.stop();
	await kettleHeater.stop();
	await glycolHeater.stop();
	await glycol.stop();
	await fill.stop();
	await sim.stop();

	tempController.stop();
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

