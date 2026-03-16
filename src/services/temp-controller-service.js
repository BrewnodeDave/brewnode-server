/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * PID Temperature Controller
 * @module tempcontroller
 * @desc As one increases the proportional gain, the system becomes faster, 
but care must be taken not make the system unstable. 
Once P has been set to obtain a desired fast response, 

The integral term is increased to stop the oscillations. 
The integral term reduces the steady state error, 
but increases overshoot. Some amount of overshoot is always 
necessary for a fast system so that it could respond to changes 
immediately. The integral term is tweaked to achieve a minimal 
steady state error. 

Once the P and I have been set to get the desired fast control 
system with minimal steady state error, 
the derivative term is increased until the loop is acceptably 
quick to its set point. Increasing derivative term decreases 
overshoot and yields higher gain with stability but would 
cause the system to be highly sensitive to noise.

*/

const broker = require('../broker.js');
const therm = require('./temp-service.js');
const kettleHeater = require('./kettle-heater-service.js');
const pumps = require('./pump-service.js');
const probes = require('../probes.js');

const NanoTimer = require('nanotimer');
const brewlog = require('../brewstack/common/brewlog.js');

let _simulationSpeed = 1;
const mashTimer = new NanoTimer();

//Periodically re-examine temp
const CALCULATION_INTERVAL_MS = 10 * 1000;
let calculationInterval = CALCULATION_INTERVAL_MS;
//Heater Mark + Space

let currentTemp;
let currentPower = null;
const heatTimer = new NanoTimer();

let timeAtTemp = 0;
const kettleThermName = "Temp Kettle";
const mashThermName = "Temp Mash";

let speedupFactor = 1;
let tempListener;

let Kp = 0;
let Ki = 0;
let Kd = 0;
let targetTemp;
const MAX_P = 3000;
const MAX_I = 1000;
const MAX_D = 1000;
let P = 0;
let I = 0;
let D = 0;
const MAX_TEMP = 97;
let prevError = 0;

function limit(value, max) {
	if (value > max) {
		return max;
	}
	else if (P < (-1 * max)) {
		return -max;
	}
	else {
		return value;
	}
}

/**
 * Calculate the power required to reach desired temperature 
 * @param {*} actualTemperature 
 * @returns {Number} power
 */
function calculatePower(actualTemperature) {
	const error = targetTemp - actualTemperature;  // Calculate the actual error
	P = limit(Kp * error, MAX_P);

	I += limit(Ki * error, MAX_I);

	D = limit(Kd * (error - prevError), MAX_D);
	let U = P + I + D;

	if (U < 0) {       // Power cannot be a negative number
		U = 0;
	}

	prevError = error;    // Save the error for the next loop

	const W = Math.min(Math.max(U, 0), kettleHeater.MAX_W);
	// brewlog.info(`delta T=${Math.floor(Math.trunc(error*10)/10)}C. P=${W}W.`);
	return W;
};

function tempHandler(value) {
	currentTemp = value;
	console.log(`🌡️  Temperature reading from ${kettleThermName}: ${currentTemp}C`);
}

/**
 * Get temperature with retry logic to handle electrical interference from pumps.
 * If temperature reading fails, temporarily stops both mash and kettle pumps to get a valid reading.
 * @param {string} thermName - Name of the temperature sensor
 * @param {number} retries - Number of retry attempts (default 3)
 * @param {number} delayMs - Delay between retries in milliseconds (default 200)
 * @returns {Promise<number>} Temperature reading
 */
async function getTempWithRetry(thermName, retries = 3, delayMs = 200) {
	let mashPumpWasOn = false;
	let kettlePumpWasOn = false;
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const temp = await therm.getTemp(thermName);

			// Check if reading is valid (not 85°C error value and within reasonable range)
			if (temp !== false && temp !== null && temp !== undefined && temp !== 85 && temp >= -10 && temp <= 110) {
				const probe = probes.find(p => p.name === thermName);
				const compensated = probe ? probe.compensate(temp) : temp;
				if (attempt > 1) {
					brewlog.info(`Temperature read succeeded on attempt ${attempt}`, compensated);
				}
				// Restore pumps if we turned them off
				if (mashPumpWasOn) {
					brewlog.info("Restoring mash pump after successful temperature read");
					pumps.on("Pump Mash");
				}
				if (kettlePumpWasOn) {
					brewlog.info("Restoring kettle pump after successful temperature read");
					pumps.on("Pump Kettle");
				}
				brewlog.info(thermName, compensated);
				return compensated;
			}

			brewlog.warn(`Invalid temperature reading: ${temp}°C (attempt ${attempt}/${retries})`);

		} catch (err) {
			brewlog.warn(`Temperature read failed (attempt ${attempt}/${retries})`, err.message);
		}

		// If we've failed once and pumps are running, stop them temporarily to reduce interference
		if (attempt === 1) {
			const mashPumpStatus = pumps.getStatus().find(p => p.name === "Pump Mash")?.value || 0;
			const kettlePumpStatus = pumps.getStatus().find(p => p.name === "Pump Kettle")?.value || 0;

			if (mashPumpStatus !== 0) {
				brewlog.info("Temporarily stopping mash pump to get clean temperature reading");
				mashPumpWasOn = true;
				pumps.off("Pump Mash");
			}

			if (kettlePumpStatus !== 0) {
				brewlog.info("Temporarily stopping kettle pump to get clean temperature reading");
				kettlePumpWasOn = true;
				pumps.off("Pump Kettle");
			}

			// Give pumps time to stop and electrical noise to settle
			if (mashPumpWasOn || kettlePumpWasOn) {
				await new Promise(resolve => setTimeout(resolve, 1000));
			}
		}

		// Wait before retry (except on last attempt)
		if (attempt < retries) {
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}
	}

	// All retries failed - restore pumps if we turned them off
	if (mashPumpWasOn) {
		brewlog.warn("Temperature read failed, restoring mash pump");
		pumps.on("Pump Mash");
	}
	if (kettlePumpWasOn) {
		brewlog.warn("Temperature read failed, restoring kettle pump");
		pumps.on("Pump Kettle");
	}

	// Return last known good value or throw
	if (currentTemp !== null && currentTemp !== undefined) {
		brewlog.error(`All temperature read attempts failed, using last known value: ${currentTemp}°C`);
		return currentTemp;
	}

	throw new Error(`Failed to read temperature from ${thermName} after ${retries} attempts`);
}

function pause() {
	heatTimer.clearInterval();
	kettleHeater.setPower(0);
	currentPower = 0;
	mashTimer.clearInterval();
}

function init(P, I, D) {
	return new Promise((resolve, reject) => {
		brewlog.info("init PID", `${P},${I},${D}`);
		//Set the PID parameters
		Kp = P;
		Ki = I;
		Kd = D
		brewlog.debug(kettleThermName);
		kettleHeater.setPower(0);

		if (_simulationSpeed !== 1) {
			calculationInterval = CALCULATION_INTERVAL_MS / _simulationSpeed;
		}
		//Force a temperature reading with retry logic
		getTempWithRetry(kettleThermName)
			.then(t => {
				brewlog.info("init PID: Current Temp=", t);
				currentTemp = t;
				resolve(currentTemp);
			}, err => {
				reject(err);
			});
	});
}

module.exports = {
	/** 
	* @desc Initialise PID parameters.
	* @param {number} P - Proportional constant.
	* @param {number} I - Integral constant.
	* @param {number} D - Derivative constant.
	*/
	init,

	/**
	* @desc Get current temp of the controller.
	* @returns {number} currentTemp - Probe temp.
	*/
	getTemp() {
		return currentTemp;
	},

	/** 
	* @desc Define temp then update until reached.
	* @param {number} desiredTemp - Desired temp.
	* @param {number} mins - Hold duration.
	*/
	setTemp(desiredTemp, mins, remaining) {
		return new Promise((resolve, reject) => {
			const minutes = Math.trunc(mins * 10) / 10;
			brewlog.debug("setTemp=", `${desiredTemp}, ${minutes}`);
			const ms = minutes * 60 * 1000;
			targetTemp = Math.round(desiredTemp * 10) / 10;

			const phaseName = `Heating to ${targetTemp}C for ${minutes * speedupFactor} mins.`;

			brewlog.info(phaseName);
			// if (currentTemp < targetTemp){
			//add heatTimer
			heatTimer.clearInterval();
			timeAtTemp = 0;
			let heatTimerRunning = false;

			heatTimer.setInterval(async () => {
				if (heatTimerRunning) return;
				heatTimerRunning = true;
				try {
					// Read temperature with retry logic to handle pump interference
					const temp = await getTempWithRetry(kettleThermName);
					currentTemp = temp;
				} catch (err) {
					brewlog.error("Failed to read kettle temperature, using last known value", err.message);
				}

				try {
					brewlog.debug("Check kettle temp", `Current:${currentTemp}, Target:${targetTemp}`);
					if (currentTemp >= targetTemp) {
						//temp reached
						timeAtTemp += calculationInterval;
						if (ms > 0) {
							remaining(Math.trunc(speedupFactor * (mins - (timeAtTemp / 60000))));
						}

						if (timeAtTemp > ms) {
							pause();
							heatTimer.clearInterval();
							resolve();
							heatTimerRunning = false;
							return;
						}
					}
					if (targetTemp >= MAX_TEMP) {
						targetTemp = MAX_TEMP;
						currentPower = kettleHeater.MAX_W;
					} else {
						currentPower = calculatePower(currentTemp);
					}
					kettleHeater.setPower(currentPower);
				} finally {
					heatTimerRunning = false;
				}
			}, '', `${calculationInterval}m`);
		});
	},

	setMashTemp(desiredTemp, done) {
		brewlog.info("setMashTemp=", desiredTemp);

		mashTimer.clearInterval();

		// Cut the heater this many degrees before the target to compensate for
		// thermal inertia in the element and pipework during recirculation.
		const THERMAL_INERTIA_OFFSET_C = 1.5;

		targetTemp = Math.round(desiredTemp * 10) / 10;
		const cutoffTemp = Math.round((desiredTemp - THERMAL_INERTIA_OFFSET_C) * 10) / 10;

		const phaseName = `Heating Mash to ${targetTemp}C.`;
		brewlog.info(phaseName);

		let mashTimerRunning = false;

		//add mashTimer with temperature retry logic
		mashTimer.setInterval(async () => {
			if (mashTimerRunning) return;
			mashTimerRunning = true;
			try {
				// Read temperature with retry logic to handle pump interference
				const temp = await getTempWithRetry(mashThermName);
				currentTemp = temp;

				brewlog.info("Check Mash temp", `${currentTemp}, ${targetTemp}`);
				if (currentTemp >= targetTemp) {
					//temp reached
					timeAtTemp += calculationInterval;
				}
				// Use cutoffTemp for PID so the heater starts ramping down before
				// the true target, preventing thermal inertia overshoot.
				currentPower = currentTemp >= cutoffTemp ? 0 : calculatePower(currentTemp);
				brewlog.info("Current Power=", `${currentPower}`);
				kettleHeater.setPower(currentPower);

				if ( done ) {
					done({ kW: currentPower, secsAtTemp: timeAtTemp / 1000 });
				}
			} catch (err) {
				brewlog.error("Failed to read mash temperature", err.message);
				// Continue with last known temperature
				currentPower = calculatePower(currentTemp);
				kettleHeater.setPower(currentPower);
				if ( done ) {
					done({ kW: currentPower, secsAtTemp: timeAtTemp / 1000 });
				}
			} finally {
				mashTimerRunning = false;
			}
		}, '', `${calculationInterval}m`);
	},

	pause,

	start: (simulationSpeed) => {
		_simulationSpeed = simulationSpeed;
		brewlog.info("temp-controller-service", "Start");
		tempListener = broker.subscribe(kettleThermName, tempHandler);
		return init(1000, 5, 100);
	},

	stop: () => {
		_simulationSpeed = 1;
		brewlog.warn("temp-controller-service", "Stop");
		pause();
		broker.unSubscribe(tempListener);
		broker.unSubscribe(tempListener);
	},
}

