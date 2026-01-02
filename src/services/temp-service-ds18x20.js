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

function setPollInterval(secs){
	brewlog.info("setSampleInterval", `${secs} secs`);
	if (pollInterval !== null){
		clearInterval(pollInterval);
		pollInterval = null;
	}

	module.exports.getStatus();
	
	pollInterval = setInterval(() => pollTemperatures(10), secs * 1000)								
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

/**
 * Get all temperatures with retry logic to handle electrical interference from pumps.
 * If temperature readings fail, temporarily stops both mash and kettle pumps to get valid readings.
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
	
	for (let attempt = 1; attempt <= retries; attempt++) {
		const result = [];
		let allValid = true;
		
		try {
			const tempObj = await new Promise((resolve, reject) => {
				ds18x20.getAll((err, tempObj) => {
					if (err) {
						reject(err);
					} else {
						resolve(tempObj);
					}
				});
			});
			
			probes.forEach(probe => {
				if (!probe.sensorHistory) {
					probe.sensorHistory = [];
				}
				for (const key in tempObj) {
					if (key == probe.id) {
						const value = tempObj[key];
						
						// Check if this reading is valid
						if (!isValidTemp(value)) {
							allValid = false;
							brewlog.warn(`Invalid temperature reading for ${probe.name}: ${value}°C (attempt ${attempt}/${retries})`);
						} else {
							probe.value = value;
						}
						
						result.push({ 
							name: probe.name, 
							value: probe.value, 
							publish: probe.publishTemp 
						});
					}	
				}
			});
			
			// If all readings are valid, restore pumps and return
			if (allValid) {
				if (attempt > 1) {
					brewlog.info(`All temperature reads succeeded on attempt ${attempt}`);
				}
				if (mashPumpWasOn && pumps) {
					brewlog.info("Restoring mash pump after successful temperature read");
					pumps.on("Pump Mash");
				}
				if (kettlePumpWasOn && pumps) {
					brewlog.info("Restoring kettle pump after successful temperature read");
					pumps.on("Pump Kettle");
				}
				return result;
			}
			
		} catch (err) {
			brewlog.warn(`Temperature read failed (attempt ${attempt}/${retries})`, err.message);
			allValid = false;
		}
		
		// If we've failed once and pumps are running, stop them temporarily to reduce interference
		if (attempt === 1 && pumps) {
			try {
				const mashPumpStatus = pumps.getStatus().find(p => p.name === "Pump Mash")?.value || 0;
				const kettlePumpStatus = pumps.getStatus().find(p => p.name === "Pump Kettle")?.value || 0;
				
				if (mashPumpStatus !== 0) {
					brewlog.info("Temporarily stopping mash pump to get clean temperature readings");
					mashPumpWasOn = true;
					pumps.off("Pump Mash");
				}
				
				if (kettlePumpStatus !== 0) {
					brewlog.info("Temporarily stopping kettle pump to get clean temperature readings");
					kettlePumpWasOn = true;
					pumps.off("Pump Kettle");
				}
				
				// Give pumps time to stop and electrical noise to settle
				if (mashPumpWasOn || kettlePumpWasOn) {
					await new Promise(resolve => setTimeout(resolve, 500));
				}
			} catch (pumpErr) {
				brewlog.warn("Error managing pumps for temperature retry", pumpErr.message);
			}
		}
		
		// Wait before retry (except on last attempt)
		if (attempt < retries) {
			await new Promise(resolve => setTimeout(resolve, delayMs));
		}
	}
	
	// All retries failed - restore pumps if we turned them off and return what we have
	if (pumps) {
		if (mashPumpWasOn) {
			brewlog.warn("Temperature reads failed, restoring mash pump");
			pumps.on("Pump Mash");
		}
		if (kettlePumpWasOn) {
			brewlog.warn("Temperature reads failed, restoring kettle pump");
			pumps.on("Pump Kettle");
		}
	}
	
	// Return the last result with whatever values we have
	const result = [];
	probes.forEach(probe => {
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

async function pollTemperatures(deltaSecs){
	const sensors = await getAllTemps();
brewlog.info('pollTemperatures');	
	// Find sensors with different values
	const changedSensors = sensors.filter((sensor, index) => {
		if (prevSensorValues[sensor.name].value){
			const changed = Math.abs((prevSensorValues[sensor.name].value - sensor.value)) >= 0.5;
//console.log({changed},sensor.name, prevSensorValues[sensor.name].value,sensor.value);
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
						sensors = await getAllTemps();
						sensors.forEach((sensor) => {
							prevSensorValues[sensor.name] = {
								value:sensor.value,
								timestamp: new Date().getTime()
							};
						});
						if (simulationSpeed !== 1){
							setPollInterval(60 / simulationSpeed);
							ambientTemp = 9.9;
						}else{
							setPollInterval(60);
							ambientTemp = sensors.find(sensor => sensor.name === "Temp Ambient")?.value;
						}
						started = true;
			
			
						resolve(ambientTemp);
			
					});
				}
			});//list
		}
	}),	
	
	
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
	}
}
