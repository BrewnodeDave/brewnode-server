/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const brewlog = require('../../brewlog.js');
const flow = require('../equipmentDrivers/flow/flow.js');
const pump = require('../equipmentDrivers/pump/pump.js');

const startCond = v => v>0;
const stopCond = v => v==0;


//Transfer contents of mash tun to kettle
module.exports = {	
	transfer(options) {
		const flowName = "FlowMashOut";
		const flowStart = () => flow.wait(flowName, startCond, options.flowTimeoutSecs);
		const flowStop = () => flow.wait(flowName, stopCond, options.flowTimeoutSecs);
		
		return new Promise((resolve, reject) => {
			brewlog.info("Begin Mash-to-Kettle transfer ");
	
			pump.mashOnSync();
			flowStart()
		    .then(flowStop)
			.then(() => {
				pump.mashOffSync();
				resolve(options);
			})
		});
	},

	min(options) {
		const secs = 116;
		return new Promise((resolve, reject) => {
			let opt = options;
			brewlog.info("Begin MINIMUM Mash-to-Kettle TRANSFER ");
			pump.mashOn()
			.then(timeout)
			.then(pump.mashOff)
			.then(resolve.bind(null,opt));
		});

		function timeout(){
			return new Promise((resolve, reject)=>{
				setTimeout(() => {
					resolve(options)
				},secs * 1000)
			});
		}
	}
}
