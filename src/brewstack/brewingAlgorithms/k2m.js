/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const brewlog	= require('../../brewlog.js');
const flow = require('../equipmentDrivers/flow/flow-service.js');
const valves 	= require('../equipmentDrivers/valve/valve-service.js');
const pump = require('../equipmentDrivers/pump/pump-service.js');

let startCond = v => v > 0;
let stopCond = v => v == 0;
	
//Transfer contents of kettle to mash tun 
module.exports = {
	
	transfer(options) {	
		const flowName = "FlowKettleOut";
		const flowStart = () => flow.wait(flowName, startCond, options.flowTimeoutSecs);
		const flowStop = () => flow.wait(flowName, stopCond, options.flowTimeoutSecs);

		return new Promise((resolve, reject) => {
			brewlog.info("Begin Kettle-to-Mash transfer");

			valves.open("ValveMashIn");

			pump.kettleOnSync();
			
			flowStart()
		    .then(flowStop)
			.then(() => {
				valves.close("ValveMashIn");
				pump.kettleOffSync();
				resolve(options)
			});
		});
	}
}
