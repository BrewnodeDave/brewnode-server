/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const valves = require('../../services/valve-service.js');
const flow = require('../../services/flow-service.js');
const pump = require('../../services/pump-service.js');
const brewlog = require('../common/brewlog.js');

const startCond = v => v > 0;
const stopCond = v => v == 0;

/**
 * @type {number} interval - A variable to store the interval ID for a setInterval or setTimeout function.
 */
let interval;
/**
 * @type {number|undefined} timeout - A variable to store the timeout ID for clearing the timeout later.
 */
let timeout;

/**
 * Modulates the start of the brewing process by opening and closing valves and controlling the pump.
 * 
 * This function sets an interval to repeatedly perform the following actions every 10 seconds:
 * - Opens the "ValveFermentIn" and "ValveChillWortIn" valves.
 * - Turns off the kettle pump synchronously.
 * 
 * After half of the interval minus 500 milliseconds, it performs the following actions:
 * - Closes the "ValveFermentIn" valve.
 * - Opens the "ValveChillWortIn" valve.
 * - Turns on the kettle pump synchronously.
 * 
 * @function
 */
function modulateStart() {
	const SLICE = 10 * 1000;
	interval = setInterval(() => {
		valves.open("ValveFermentIn");
		valves.open("ValveChillWortIn");
		pump.kettleOffSync();
		timeout = setTimeout(() => {
			valves.close("ValveFermentIn");
			valves.open("ValveChillWortIn");
			pump.kettleOnSync();
		}, (SLICE / 2) - 500);
	}, SLICE);
}

/**
 * Stops the modulation process by clearing the interval and timeout,
 * and closing the specified valves.
 *
 * @function
 */
function modulateStop() {
	clearInterval(interval);
	clearTimeout(timeout);
	valves.close("ValveChillWortIn");
	valves.close("ValveFermentIn");
}

module.exports = {
	/**
	 * Transfers wort from the kettle to the fermenter.
	 *
	 * @param {Object} opt - The options for the transfer process.
	 * @param {number} opt.flowTimeoutSecs - The timeout in seconds for the flow operations.
	 * @returns {Promise} A promise that resolves when the transfer is complete.
	 */
	transfer: async function(opt) {
		let timeoutSecs = opt.flowTimeoutSecs;

		console.log("k2f transfer")

		valves.open("ValveChillWortIn");
		valves.open("ValveFermentIn");
		pump.kettleOnSync();
		await flow.wait("FlowKettleOut", startCond, timeoutSecs);
		await flow.wait("FlowKettleOut", stopCond, timeoutSecs);
				
		pump.kettleOffSync();
		valves.close("ValveChillWortIn");
		valves.close("ValveFermentIn");
		
		brewlog.info("... k2f end");
		return opt;
	}
}
