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
const { doublePublish } = require("./mysql-service.js");
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

	module.exports.getStatus(true);
	
	pollInterval = setInterval(pollTemperatures, secs * 1000)								
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
			for (const key in tempObj) {
				if (key == probe.id) {
					const value = tempObj[key];
					result.push({ name: probe.name, value, publish: probe.publishTemp });
				}
			}
		});
		return result;
	} catch (err) {
		brewlog.error("Failed to get all temperatures", err);
		return result;
	}
}

async function pollTemperatures(){
	const sensors = await getAllTemps();
	const sensorValues =  sensors.map(sensor => sensor.value);

	// Find sensors with different values
	const changedSensors = sensors.filter((sensor, index) => Math.abs(sensor.value - prevSensorValues[index]) >= 0.2);

	// Publish changes for sensors with different values
	changedSensors.forEach(sensor => {
		sensor?.publish(sensor.value);

		// Update previous sensor values
		prevSensorValues = sensorValues;
	});

}

module.exports = { 	
	/* Upon initialisation, check that all temperature sensors are found.
	* If not then subsequent temperature measurements will report a fail
	*/
	start: (simulationSpeed) => 
		
		 new Promise(async (resolve, reject) => {
	
			brewlog.info("temp.js","start");
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
	
			const done = resolve;
			if (pollInterval === null){
				ds18x20.isDriverLoaded((err, isLoaded) => {
					if (err){
						brewlog.critical("Temperature driver is not loaded.", err);
						reject(err);
					}
					else {
						ds18x20.list((err, listOfDeviceIds) => {
							if(err){
								brewlog.critical("Failed to start temp:",err);
								reject(err);
							}
							else{
								getAllTemps();
								ds18x20.getAll(async (err, tempObj) => {
									if(err){
										brewlog.error("Failed to get all temperatures", err);
										reject(err);
									}else{
										probes.forEach(probe => {
											const publish = broker.create(probe.name);
											probe.publishTemp = (value, timestamp) => (value != 85) ? publish(value, timestamp) : null;
											if (simulationSpeed !== 1){
												ds18x20.set(probe.name, 9.9);
											}
										});
										
										if (simulationSpeed !== 1){
											setPollInterval(60 / simulationSpeed);
											ambientTemp = 9.9;
										}else{
											setPollInterval(10);
											const ambientId = probes.find(probe => probe.name === 'TempMash').id; 
											ambientTemp = tempObj[ambientId];
										}
										started = true;

										done(ambientTemp);
									}
								});
							}
						});//list
					}
				});	
			}//timer null

			const sensors = await getAllTemps();
		 	prevSensorValues =  sensors.map(sensor => sensor.value);
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
	getStatus() {
		return new Promise((resolve, reject) => {		
			ds18x20.getAll((err, tempObj) => {
				let result = [];
				if(err){
					// brewlog.critical("Failed to find any temp sensors.", err);
					resolve(result);
				}else{
					probes.forEach(probe => {
						for (const key in tempObj){
							if (key == probe.id){					
								const value = tempObj[key];
								const delta = (probe.prevValue === null) ? 0 : probe.prevValue - value;
								
								if (value == 85){
									//85 can be indiciative of an error but not always
									// brewlog.warning(`${probe.name} has maybe failed (85)`);
								}else{
									if ((Math.abs(delta) > 0.5))
									{
										if (probe.publishTemp){
											doublePublish(probe.publishTemp, probe.prevValue, value);
											// probe.publishTemp(value);
											probe.prevValue = value;
										}
									}
								}//if 85
								result.push({name:probe.name, value});									
							}//if probe.id
						}//for key
					});//PROBES.forEach

					resolve(result);
				}//else
			});//getAll
		});//promise
	},//getStatus
	
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
						resolve(temp);
					}
				});
			} catch (err) {
				console.log(name);
				reject(err);
			}
		});
	}
}
