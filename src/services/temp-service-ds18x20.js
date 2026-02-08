/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Temperature Sensor Driver.
 * @module temp
 * @author Dave Leitch
 * @requires brewdefs
 * @requires ds18x20
 * @requires brewlog
 * @requires events
 * @desc This driver usedis  to monitor all temperature sensors.
 * Periodically all sensors are checked for any changes. 
 * If a change is detected, the new temperature is emitted.
*/
 
let ds18x20;
const brewlog = require("../brewstack/common/brewlog.js");
const broker = require("../broker.js");
let probes = require('../probes.js');
let pumps = null; // Lazy loaded to avoid circular dependency

let pollInterval = null;

let prevSensorValues = [];

let started = false;

// Active fermenter: "UNI" for UniTank or "SS" for SSBrewtech
let activeFermenter = "UNI";

/**
* @desc Get the currently active fermenter vessel.
* @returns {string} The active fermenter: "UNI" or "SS"
*/
function getActiveFermenter() {
	return activeFermenter;
}

function setPollInterval(secs){
	brewlog.info("setSampleInterval", `${secs} secs`);
	if (pollInterval !== null){
		clearInterval(pollInterval);
		pollInterval = null;
	}

	module.exports.getStatus();
	
	pollInterval = setInterval(() => pollTemperatures(), secs * 1000)								
}

/**
 * Validate if a temperature reading is acceptable
 * @param {number} temp - Temperature value to validate
 * @returns {boolean} True if temperature is valid
 */
function isValidTemp(temp) {
	return temp !== false && temp !== null && temp !== undefined && 
	       temp !== 85 && temp >= -10 && temp <= 110;
}

function foo(probe){
	let result = [];
	if (!probe.sensorHistory) {
		probe.sensorHistory = [];
	}
					
	if (getActiveFermenter() === "UNI"){
		if (probe.name === "Temp UniTank") {
			result.push({ 
				name: "Temp Fermenter", 
				value: probe.value, 
				publish: probe.publishTemp 
			});
		}
		if (probe.name === "Temp SS") {
			result.push({ 
				name: "Temp Ambient", 
				value: probe.value, 
				publish: probe.publishTemp 
			});
		}
	} else {
		if (probe.name === "Temp SS") {
			result.push({ 
				name: "Temp Fermenter", 
				value: probe.value, 
				publish: probe.publishTemp 
			});
		}
		if (probe.name === "Temp UniTank") {
			result.push({ 
				name: "Temp Ambient", 
				value: probe.value, 
				publish: probe.publishTemp 
			});
		}
	}

	return result;
}

/**
 * Read a single temperature sensor with retry logic
 * @param {Object} probe - Probe object with id and name
 * @param {number} retries - Number of retry attempts
 * @param {number} delayMs - Delay between retries in milliseconds
 * @returns {Promise<number|null>} Temperature value or null if failed
 */
async function readSingleTemp(probe, retries = 3, delayMs = 200) {
	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			const value = await new Promise((resolve, reject) => {
				ds18x20.get(probe.id, (err, temp) => {
					if (err) {
						reject(err);
					} else {
						resolve(temp);
					}
				});
			});
			
			if (isValidTemp(value)) {
				if (attempt > 1) {
					brewlog.info(`Temperature read for ${probe.name} succeeded on attempt ${attempt}`);
				}
				return value;
			} else {
				brewlog.warn(`Invalid temperature reading for ${probe.name}: ${value}°C (attempt ${attempt}/${retries})`);
			}
		} catch (err) {
			brewlog.warn(`Temperature read failed for ${probe.name} (attempt ${attempt}/${retries})`, err.message);
		}
		
		// Wait before retry (except on last attempt)
		if (attempt < retries) {
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}
	}
	
	return null; // All retries failed
}

/**
 * Get all temperatures with retry logic to handle electrical interference from pumps.
 * If temperature readings fail, temporarily stops both mash and kettle pumps to get valid readings.
 * Only retries individual sensors that failed, not all sensors.
 * @param {number} retries - Number of retry attempts (default 3)
 * @param {number} delayMs - Delay between retries in milliseconds (default 200)
 * @returns {Promise<Array>} Array of temperature sensor objects
 */
async function getAllTemps(retries = 3, delayMs = 200) {
	// Lazy load pumps service to avoid circular dependency
	if (!pumps) {
		try {
			pumps = require('./pump-service.js');
		} catch (err) {
			brewlog.warn("Could not load pump service for temperature retry logic", err.message);
		}
	}
	
	let mashPumpWasOn = false;
	let kettlePumpWasOn = false;
	let pumpsStopped = false;
	
	// First attempt: read all sensors at once
	let tempObj = {};
	try {
		console.log('getAllTemps: Reading all temperature sensors...');
		tempObj = await Promise.race([
			new Promise((resolve, reject) => {
				ds18x20.getAll((err, temps) => {
					if (err) {
						console.log('getAllTemps: ds18x20.getAll() error:', err.message);
						reject(err);
					} else {
						console.log('getAllTemps: ds18x20.getAll() success, sensors:', Object.keys(temps).length);
						resolve(temps);
					}
				});
			}),
			new Promise((_, reject) => 
				setTimeout(() => reject(new Error('Temperature read timeout after 5s')), 5000)
			)
		]);
	} catch (err) {
		console.log('getAllTemps: Temperature read failed:', err.message);
		brewlog.warn("Initial temperature read failed", err.message);
	}
	
	// Check which probes have invalid readings
	const failedProbes = [];
	probes.forEach(probe => {
		const value = tempObj[probe.id];
		if (isValidTemp(value)) {
			probe.value = value;
		} else {
			failedProbes.push(probe);
			brewlog.warn(`Invalid temperature reading for ${probe.name}: ${value}°C, will retry`);
		}
	});
	
	// If any sensors failed and pumps are running, stop them temporarily
	if (failedProbes.length > 0 && pumps) {
		try {
			const mashPumpStatus = pumps.getStatus().find(p => p.name === "Pump Mash")?.value || 0;
			const kettlePumpStatus = pumps.getStatus().find(p => p.name === "Pump Kettle")?.value || 0;
			
			if (mashPumpStatus !== 0) {
				brewlog.info("Temporarily stopping mash pump to get clean temperature readings");
				mashPumpWasOn = true;
				pumps.off("Pump Mash");
				pumpsStopped = true;
			}
			
			if (kettlePumpStatus !== 0) {
				brewlog.info("Temporarily stopping kettle pump to get clean temperature readings");
				kettlePumpWasOn = true;
				pumps.off("Pump Kettle");
				pumpsStopped = true;
			}
			
			// Give pumps time to stop and electrical noise to settle
			if (pumpsStopped) {
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		} catch (pumpErr) {
			brewlog.warn("Error managing pumps for temperature retry", pumpErr.message);
		}
	}
	
	// Retry only the failed sensors
	for (const probe of failedProbes) {
		const value = await readSingleTemp(probe, retries, delayMs);
		if (value !== null) {
			probe.value = value;
		} else {
			brewlog.warn(`All retries failed for ${probe.name}, keeping previous value`);
		}
	}
	
	// Restore pumps if we turned them off
	if (pumps) {
		if (mashPumpWasOn) {
			brewlog.info("Restoring mash pump after temperature read");
			pumps.on("Pump Mash");
		}
		if (kettlePumpWasOn) {
			brewlog.info("Restoring kettle pump after temperature read");
			pumps.on("Pump Kettle");
		}
	}
	
	// Build result array with all sensor data
	let result = [];
	probes.forEach(probe => {
		result.push(...foo(probe));
		result.push({ 
			name: probe.name, 
			value: probe.value, 
			publish: probe.publishTemp 
		});
	});
	
	return result;
}

function updateProbeValue(probe, value) {
	if (!probe.sensorHistory) {
		probe.sensorHistory = [];
	}

	//avoid 85.0 which is a fail
	if (value === 85) return;

	const compensated = probe.compensate(value);
	
	// Add the current value to the history
	probe.sensorHistory.push(compensated);

	// Keep only the last 10 values
	if (probe.sensorHistory.length > 10) {
		probe.sensorHistory.shift();
	}

	// Exclude the highest and lowest values
	const sortedHistory = [...probe.sensorHistory].sort((a, b) => a - b);
	const trimmedHistory = sortedHistory.slice(1, -1);

	// Calculate the average of the trimmed history
	const average = Math.round((trimmedHistory.reduce((sum, val) => sum + val, 0) / trimmedHistory.length) * 10) / 10;

	probe.value = average;
}

async function pollTemperatures(){
	const sensors = await getAllTemps();
	// Find sensors with different values
	const changedSensors = sensors.filter((sensor, index) => {
		if (prevSensorValues[sensor.name].value){
			const changed = Math.abs((prevSensorValues[sensor.name].value - sensor.value)) >= 0.5;
			prevSensorValues[sensor.name].value = changed ? sensor.value : prevSensorValues[sensor.name].value; 
			return changed;
		}else{
			prevSensorValues[sensor.name].value = sensor.value;
			return true;
		}
	});			

	// Publish changes for sensors with different values
	changedSensors.forEach(async (sensor) => await sensor?.publish(sensor.value));
}

module.exports = { 	
	/* Upon initialisation, check that all temperature sensors are found.
	* If not then subsequent temperature measurements will report a fail
	*/
	start: (simulationSpeed) => new Promise(async (resolve, reject) => {
		if (started === true){
			resolve();
			return;
		}
		
		if (simulationSpeed !== 1){
			ds18x20 = require('../sim/ds18x20.js');
		}else{
			// @ts-ignore
			ds18x20 = require('ds18x20');
		}

		if (pollInterval === null){
			ds18x20.isDriverLoaded((err, isLoaded) => {
				if (err){
					brewlog.critical("Temperature driver is not loaded.", err);
					reject(err);
				}
				else {
					ds18x20.list(async (err, listOfDeviceIds) => {
						if(err){
							brewlog.critical("Failed to start temp:",err);
							reject(err);
							return;
						}
						else{
							probes.forEach(probe => {
								const publish = broker.create(probe.name);
								probe.publishTemp = (value, timestamp) => (value != 85) ? publish(value, timestamp) : false;

								if (simulationSpeed !== 1){
									ds18x20.set(probe.name, 9.9);
								}
							});
						}
						
						// Save initial sensor values
						console.log('start: Saving initial sensor values...');
						sensors = await getAllTemps();
						sensors.forEach((sensor) => {
							prevSensorValues[sensor.name] = {
								value:sensor.value,
								timestamp: new Date().getTime()
							};
						});
						console.log('start: Initial sensor values saved');
						
						if (simulationSpeed !== 1){
							setPollInterval(60 / simulationSpeed);
							ambientTemp = 9.9;
							console.log('start: Simulation mode - ambient temp set to 9.9°C');
						}else{
							setPollInterval(60);
							// Get ambient temp from the already-read sensor values instead of calling ds18x20.get()
							const ambientProbeName = activeFermenter !== "UNI" ? "Temp UniTank" : "Temp SS";
							const ambientSensor = sensors.find(s => s.name === ambientProbeName);
							ambientTemp = ambientSensor ? ambientSensor.value : 20; // Default to 20°C if not found
							console.log('start: Ambient temp set to', ambientTemp, '°C from', ambientProbeName);
						}
						started = true;
			
						console.log('start: Temperature service started successfully');
						resolve(ambientTemp);
			
					});
				}
			});//list
		}
	}),	
	
	getAmbientTemp: () => {
		return new Promise((resolve, reject) => {
			try {
				const probeName = activeFermenter !== "UNI" ? "Temp UniTank" : "Temp SS";
				const probe = probes.find(p => p.name === probeName);
				ds18x20.get(probe.id, (err, temp) => {
					if (err){
						reject(err);
					}else{
						resolve(probe.value);
					}
				});
			} catch (err) {
				reject(err);
			}
		});
	},
	getFermenterTemp: () => {
		return new Promise((resolve, reject) => {
			try {
				const probeName = activeFermenter === "UNI" ? "Temp UniTank" : "Temp SS";
				const probe = probes.find(p => p.name === probeName);
				ds18x20.get(probe.id, (err, temp) => {
					if (err){
						reject(err);
					}else{
						resolve(probe.value);
					}
				});
			} catch (err) {
				reject(err);
			}
		});
	},
	/**
	* Stop the temperature service.
	*/
	stop() {
		return new Promise((resolve, reject) => {
			if (started === true){
				if (pollInterval !== null){
					clearInterval(pollInterval);
				}
				pollInterval = null;
				
				started = false;
				probes.forEach(({name}) => {
					broker.destroy(name);
				});
			}
			brewlog.warn("temp.js", "stopped");

			resolve();
		});
	},
	
	setSampleInterval: setPollInterval,
	
	/**
	* Emit the current temperature.
	* @desc Only the probes whose temperature has changed will fire an event.
	* @param {boolean} force - Force a status reading regardless of value.
	* @fires temp
	*/
	getStatus: getAllTemps,
	
	/**
	* @desc Get temp of a single probe.
	* @param {string} name - Probe name.
	*/
	getTemp(name) {
		return new Promise((resolve, reject) => {
			try {
				const probe = probes.find(p => p.name === name);
				ds18x20.get(probe.id, (err, temp) => {
					if (err){
						reject(err);
					}else{
						// updateProbeValue(probe, temp);
						resolve(probe.value);
					}
				});
			} catch (err) {
				console.log(name);
				reject(err);
			}
		});
	},

	/**
	* @desc Set the active fermenter vessel.
	* @param {string} vessel - Vessel type: "UNI" for UniTank or "SS" for SSBrewtech
	* @returns {string} The active fermenter that was set
	*/
	setActiveFermenter(vessel) {
		const normalized = vessel.toUpperCase();
		if (normalized !== "UNI" && normalized !== "SS") {
			throw new Error('Invalid fermenter type. Must be "UNI" or "SS"');
		}
		activeFermenter = normalized;
		brewlog.info("setActiveFermenter", `Active fermenter set to: ${activeFermenter}`);
		return activeFermenter;
	},

	getActiveFermenter
}

