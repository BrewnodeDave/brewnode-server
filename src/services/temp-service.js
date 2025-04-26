/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const PIN = 4;
const FAHRENHEIT = false;

/**
 * Temperature Sensor Driver.
 * @module temp
 * @author Dave Leitch
 * @requires brewdefs
 * @requires ds18b20
 * @requires brewlog
 * @requires events
 * @desc This driver usedis  to monitor all temperature sensors.
 * Periodically all sensors are checked for any changes. 
 * If a change is detected, the new temperature is emitted.
*/
 
let ds18b20 = null;
let sensorList = [];


const brewlog = require("../brewstack/common/brewlog.js");
const broker = require("../broker.js");
const { doublePublish } = require("./mysql-service.js");
let probes = require('../probes.js');

let pollInterval = null;
let prevSensors = [];
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

const readSensor = (id) => ds18b20.read_one_sensor_sync(PIN, id, FAHRENHEIT);
const readAllSensors = () => ds18b20.read_sensor_sync(PIN, FAHRENHEIT);
const listSensors = () => ds18b20.list_sensor(PIN);

const readAllSensorsAsync = () => {
	return new Promise((resolve, reject) => {
		try {
			ds18b20.read_sensor(PIN, FAHRENHEIT, resolve);
		} catch (err) {
			reject(err);
		}
	}	);
};
const readSensorAsync = (id) => {
	return new Promise((resolve, reject) => {
		try {
			ds18b20.read_one_sensor(PIN, id, FAHRENHEIT, resolve);
		} catch (err) {
			reject(err);
		}
	});
};

async function getAllTemps() {
	let result = [];
	try {		
		const sensors = await readAllSensorsAsync();

		probes.forEach(probe => {
			const sensorId = sensorList.findIndex(id => id === probe.id);
			if (sensorId === -1){
				// brewlog.error("Failed to find sensor id=", probe.id);
				return;
			}
			const value = sensors[sensorId];
			if (value){
				// const compensated = probe.compensate(value);
				const compensated = parseFloat(value.toFixed(1)); // Limit to 1 decimal place

				result.push({ name: probe.name, value:compensated, publish: probe.publishTemp });
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

	// Find sensors with different values
	const changedSensors = sensors.filter((sensor) => {
		const prevValue = prevSensors.find(s => s.name === sensor.name);
		if (!prevValue) {
			return false; // Skip if previous value not found
		}
		if (Math.abs(sensor.value - prevValue.value) < 0.2){
			return false;
		}
		return sensor;
	});

	
	changedSensors.forEach(sensor => {
		sensor.publish(sensor.value);

		const index = prevSensors.findIndex(s => s.name === sensor.name);
		if (index !== -1) {
			prevSensors[index] = sensor;
		}
	});

}

let sensors =[];
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
			
			if (simulationSpeed === 1){
				ds18b20 = require("@iiot2k/ds18b20");
			}else{
				// @ts-ignore
				ds18b20 = require("../sim/ds18b20");
			}

			sensorList = listSensors(PIN);

			const done = resolve;
			if (pollInterval === null){
				probes.forEach(probe => {
					const publish = broker.create(probe.name);
					probe.publishTemp = (value, timestamp) => (value != 85) ? publish(value, timestamp) : null;
					if (simulationSpeed !== 1){
						ds18b20.set(probe.name, 9.9);
					}
				});
										
				if (simulationSpeed !== 1){
					setPollInterval(60 / simulationSpeed);
					ambientTemp = 9.9;
				}else{
					setPollInterval(10);
					const ambientId = probes.find(probe => probe.name === 'TempAmbient').id; 
					ambientTemp = readSensor(ambientId);
				}
				started = true;

				done(ambientTemp);
			}

			prevSensors = await getAllTemps();
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

			sensorList = [];
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
	async getStatus() {
		let result = [];

			const sensors = await readAllSensorsAsync();

			probes.forEach(probe => {
				const sensorId = sensorList.findIndex(id => id === probe.id);
				if (sensorId === -1){
					// brewlog.error("Failed to find sensor id=", probe.id);
					return;
				}
				const value = sensors[sensorId];
								
				if (value == 85){
					//85 can be indiciative of an error but not always
					// brewlog.warning(`${probe.name} has maybe failed (85)`);
				}else{
					// const compensated = probe.compensate(value);
					const compensated = parseFloat(value.toFixed(1)); // Limit to 1 decimal place

					const delta = (probe.prevValue === null) ? 0 : probe.prevValue - compensated;
				
					if ((Math.abs(delta) > 0.5))
					{
						if (probe.publishTemp){
							doublePublish(probe.publishTemp, probe.prevValue, compensated);
							// probe.publishTemp(value);
							probe.prevValue = compensated;
						}
					}
					result.push({name:probe.name, value:compensated});									
				}//if 85
			});
			
			return result;
		},//getStatus
	
	/**
	* @desc Get temp of a single probe.
	* @param {string} name - Probe name.
	*/
	async getTemp(name) {
		try {
			const probe = probes.find(p => p.name === name);
			return await readSensorAsync(probe.id);
		} catch (err) {
			console.log(name);			
		}
	}
}
