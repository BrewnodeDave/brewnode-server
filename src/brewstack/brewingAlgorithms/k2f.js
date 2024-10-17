/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const valves = require('../equipmentDrivers/valve/valve-service.js');
const flow = require('../equipmentDrivers/flow/flow-service.js');
const pump = require('../equipmentDrivers/pump/pump-service.js');
const brewlog = require('../../brewlog.js');
const phase = require('./phase.js');

const startCond = v => v > 0;
const stopCond = v => v == 0;

let interval;
let timeout;
//modulate valves so that only one is open at a time.
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
function modulateStop() {
	clearInterval(interval);
	clearTimeout(timeout);
	valves.close("ValveChillWortIn");
	valves.close("ValveFermentIn");
}

module.exports = {
	transfer(opt) {
		return new Promise((resolve, reject) => {
			let timeoutSecs = opt.flowTimeoutSecs;

			console.log("k2f transfer")

			valves.open("ValveChillWortIn");
			valves.open("ValveFermentIn");

			pump.kettleOnSync()

			flow.wait("FlowKettleOut", startCond, timeoutSecs)
				.then(() => {
					//flow.wait("FlowFermentIn",	stopCond, timeoutSecs), 
					return flow.wait("FlowKettleOut", stopCond, timeoutSecs);
				})
				.then(() => {
					pump.kettleOffSync();
					valves.close("ValveChillWortIn");
					valves.close("ValveFermentIn");
					brewlog.info("... k2f end");
					phase.end("K2F");
					resolve(opt);
				}).catch(err => {
					console.log("oops", err)
				});
		});
	}
}
