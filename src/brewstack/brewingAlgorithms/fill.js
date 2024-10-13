const delay = require('../../common/delay.js');
const valves = require('../equipmentDrivers/valve/valve.js');
const flow = require('../equipmentDrivers/flow/flow.js');
const kettle = require('../equipmentDrivers/kettle/kettle.js');
const brewlog = require('../../common/brewlog.js')

const INTERVAL_SECS = 10;

let _intervalSecs = INTERVAL_SECS;
let _speedupFactor = 1;
let opt = null;

function waitUntilFilled(targetVolume) {
	/** Volume that gets through while the vqlve is closing */
	const FILL_VALVE_CLOSE_VOLUME = 0.821;//570;

	return new Promise((resolve, reject) => {
		//Monitor kettle volume
		kettle.emitter.on(kettle.eventName, (name, value) => {
			if (name === 'volume') {
				if (value >= (targetVolume - FILL_VALVE_CLOSE_VOLUME)) {
					resolve(value);
				}
			}
		});
	});
}

module.exports = {
	start(brewOptions) {
		return new Promise((resolve, reject) => {
			opt = brewOptions;
			if (brewOptions.sim.simulate) {
				_speedupFactor = brewOptions.sim.speedupFactor;
				_intervalSecs = _intervalSecs / brewOptions.sim.speedupFactor;
			}

			resolve(brewOptions);
		});
	},
	stop() {
		return new Promise((resolve, reject) => {
			brewlog.info("fill.js", "stopped");
			resolve();
		})
	},
	/** 
	 * @desc Fill the kettle based upon time tyhe input valve is open.
	 * @param {object} opt - Brew Options
	 * @param {function} progress - Phase progress
	 */
	timedFill(opt, progress) {
		return new Promise((resolve, reject) => {
			const FILL_VALVE_NAME = 'ValveKettleIn';
			const mLPerSec = 200;
			//128 from garden hose	
			//196 from blue hose

			//If delay is too short then no flow pulses will be registered.
			let t = (opt.strikeLitres * 1000 / mLPerSec) / _speedupFactor;

			//valveSwitchDelay is in mS
			if (t * 1000 < opt.valveSwitchDelay) {
				//bypass pulses and simply update kettle volume
				//				kettle.updateVolume(litres);
				resolve();
			} else {
				valves.open(FILL_VALVE_NAME);
				//Update progress every litre
				let progressInterval;
				if (progress !== undefined) {
					let msPerLitre = 1000 * (1000 / mLPerSec) / _speedupFactor;
					let n = 1;
					progressInterval = setInterval(() => {
						if (progress) {
							progress(`${n++}`);
						}
					}, msPerLitre);
				}

				//t must be in secs.
				return delay(t, "Fill")
					.then(() => {
						clearInterval(progressInterval);
						valves.close(FILL_VALVE_NAME);
						resolve();
					});
			}
		});
	},

}
