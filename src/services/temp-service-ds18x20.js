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

async function getAllTemps() {
	let result = [];
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

					updateProbeValue(probe, value);

					result.push({ 
						name: probe.name, 
						value: probe.value, 
						publish: probe.publishTemp 
					});
				}	
			}
		});
		return result;
	} catch (err) {
		brewlog.error("Failed to get all temperatures", err);
		return result;
	}
}

function updateProbeValue(probe, value) {
	if (!probe.sensorHistory) {
		probe.sensorHistory = [];
	}

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
	
	// Find sensors with different values
	const changedSensors = sensors.filter((sensor, index) => {
		const changed = (prevSensorValues[sensor.name] !== sensor.value);
		prevSensorValues[sensor.name] = changed ? sensor.value : prevSensorValues[sensor.name]; 
		return changed;
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
								probe.publishTemp = (value, timestamp) => (value != 85) ? publish(value, timestamp) : null;

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
							setPollInterval(10);
							ambientTemp = sensors.find(sensor => sensor.name === "Temp Ambient")?.value;
						}
						started = true;
			
			
						resolve(ambientTemp);
			
					});
				}
			});//list

			if (simulationSpeed !== 1){
				setPollInterval(60 / simulationSpeed);
				ambientTemp = 9.9;
			}else{
				setPollInterval(10);
				ambientTemp = sensors.find(sensor => sensor.name === "Temp Ambient")?.value;
			}
			started = true;


			resolve(ambientTemp);
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
			brewlog.info("temp.js", "stopped");

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
						updateProbeValue(probe, temp);
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
