/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const brewlog = require('../common/brewlog.js');
const flow = require('../../services/flow-service.js');
const pump = require('../../services/pump-service.js');

const startCond = v => v>0;
const stopCond = v => v == 0;

//Transfer contents of mash tun to kettle
module.exports = {	
	transfer: async function(options) {
		const flowName = "FlowMashOut";
		const flowStart = () => flow.wait(flowName, startCond, options.flowTimeoutSecs);
		const flowStop = () => flow.wait(flowName, stopCond, options.flowTimeoutSecs);
		
		brewlog.info("Begin Mash-to-Kettle transfer ");
	
		pump.mashOnSync();
		await flowStart()
		await flowStop()
		pump.mashOffSync();
		return options;
	},

	min: async function (options) {
		const secs = 116;
		let opt = options;
		brewlog.info("Begin MINIMUM Mash-to-Kettle TRANSFER ");

		await pump.mashOn();
		await timeout();
		await pump.mashOff();
		return opt;
	
		async function timeout(){
			setTimeout(() => {
				return options;
			},secs * 1000)
		}
	}
}
