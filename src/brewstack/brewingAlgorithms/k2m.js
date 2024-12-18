/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const brewlog	= require('../common/brewlog.js');
const flow = require('../../services/flow-service.js');
const valves 	= require('../../services/valve-service.js');
const pump = require('../../services/pump-service.js');

let startCond = v => v > 0;
let stopCond = v => v == 0;
const flowName = "FlowKettleOut";
const flowStart = () => flow.wait(flowName, startCond, options.flowTimeoutSecs);
const flowStop = () => flow.wait(flowName, stopCond, options.flowTimeoutSecs);


//Transfer contents of kettle to mash tun 
module.exports = {
	/**
	 * Transfers liquid from the kettle to the mash tun.
	 *
	 * @param {Object} options - The options for the transfer process.
	 * @param {number} options.flowTimeoutSecs - The timeout in seconds for the flow operations.
	 * @returns {Promise<Object>} A promise that resolves with the options object when the transfer is complete.
	 */
	transfer: async function(options) {	
		brewlog.info("Begin Kettle-to-Mash transfer");

		valves.open("ValveMashIn");
		pump.kettleOnSync();
		await flowStart();
		await flowStop()
		valves.close("ValveMashIn");
		pump.kettleOffSync();

		return options;
	}
}
