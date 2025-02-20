/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const delay = require('../brewstack/common/delay.js');
const valves = require('./valve-service.js');
const kettleHeater = require('./kettle-heater-service.js');
const brewlog = require('../brewstack/common/brewlog.js')
const {remainingFillLitres} = require('../broker.js');	

const INTERVAL_SECS = 10;

let _intervalSecs = INTERVAL_SECS;
let _simulationSpeed = null;

function waitUntilFilled(targetVolume) {
	/** Volume that gets through while the vqlve is closing */
	const FILL_VALVE_CLOSE_VOLUME = 0.821;//570;

	return new Promise((resolve, reject) => {
		//Monitor kettle volume
		kettleHeater.emitter.on(kettleHeater.eventName, (name, value) => {
			if (name === 'volume') {
				if (value >= (targetVolume - FILL_VALVE_CLOSE_VOLUME)) {
					resolve(value);
				}
			}
		});
	});
}

module.exports = {
	start: (simulationSpeed) =>  
		new Promise((resolve, reject) => {
			_simulationSpeed = simulationSpeed;
			_intervalSecs = _intervalSecs / _simulationSpeed;
			resolve();
		}
	),
	stop() {
		return new Promise((resolve, reject) => {
			brewlog.info("fill.js", "stopped");
			resolve();
		})
	},

	timedFill(strikeLitres) {
		return new Promise((resolve, reject) => {
			const FILL_VALVE_NAME = 'ValveKettleIn';
			const mLPerSec = 200;

			//The time it takes to open & close, 1.0L pass.

			//If delay is too short then no flow pulses will be registered.
			const mLPerL = 	1000;
			let tSecs = (mLPerL * strikeLitres / mLPerSec) / _simulationSpeed;

			//valveSwitchDelay is in mS
			const valveSwitchDelay = 3000 / _simulationSpeed;
			const msPerSec = 1000;
			if ((tSecs * msPerSec) < valveSwitchDelay) {
				//bypass pulses and simply update kettle volume
				//				kettle.updateVolume(litres);
				resolve();
			} else {
				valves.open(FILL_VALVE_NAME);

				//Update progress every litre
				let msPerLitre = msPerSec * (mLPerL / mLPerSec) / _simulationSpeed;
				let n = 1;
				const progressInterval = setInterval(() => {
					remainingFillLitres(strikeLitres - n);
					console.log({n})
					n++;	
				}, msPerLitre);
			
				//t must be in secs.
				return delay(tSecs, "Fill")
					.then(() => {
						clearInterval(progressInterval);
						console.log(0)
						remainingFillLitres(0);
						valves.close(FILL_VALVE_NAME);
						resolve();
					});
			}
		});
	},

}
