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

const readSensor = (id) => ds18b20.read_one_sensor_sync(PIN, id, FAHRENHEIT);
const readAllSensors = () => ds18b20.read_sensor_sync(PIN, FAHRENHEIT);
const listSensors = () => ds18b20.list_sensor(PIN);

const id2name = id => probes.find(probe => probe.id === id).name;

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

/**
 * Retrieves all temperature readings from sensors, processes them, and returns
 * a list of temperature data objects with compensation applied.
 *
 * @async
 * @function
 * @returns {Promise<Array<{name: string, value: number, publish: boolean}>>} 
 *          A promise that resolves to an array of objects containing:
 *          - `name` (string): The name of the probe.
 *          - `value` (number): The compensated temperature value, limited to 1 decimal place.
 *          - `publish` (function): Function to call if not null.
 *
 * @throws {Error} Logs an error if the temperature retrieval process fails.
 */
async function getAllTemps() {
	let result = [];
	try {		
		const sensorValues = await readAllSensorsAsync();

		result = sensorValues.map((value, index) => ({
			name : sensorList[index],
			value : parseFloat(value.toFixed(1)), // Limit to 1 decimal place
			publish : probes.find(probe => probe.id === sensorList[index]).publishTemp
		}));
	} catch (err) {
		brewlog.error("Failed to get all temperatures", err);
	};

	return result;
}

async function pollTemperatures(deltaSecs){
	const maxDegPerMin = 0.5;
	const minDeltaC = 0.25;

	const sensors = await getAllTemps();

	// Find sensors with different values
	const changedSensors = sensors.filter((sensor, index) => {
		if (prevSensorValues[sensor.name] === undefined) {
			return true;
		}
		const deltaC = Math.abs(sensor.value - prevSensorValues[sensor.name]);
		const degPerMin = Math.abs(deltaC / (deltaSecs / 60));

		return (deltaC > minDeltaC) && (degPerMin < maxDegPerMin);
	});

	// Publish changes for sensors with different values
	changedSensors.forEach(sensor => {
		sensor?.publish(sensor.value);

		// Update previous sensor values
		prevSensorValues[sensor.name] = sensor.value;
	});

}

const probeId = name => probes.find(p => p.name === name).id;

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
					const ambientId = probeId('TempAmbient'); 
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
				probes.forEach(({name}) => broker.destroy(name));
			}
			brewlog.info("temp.js", "stopped");

			sensorList = [];
			resolve();
		});
	},
	
	setSampleInterval: setPollInterval,
	
	async getStatus() {
			const sensorValues = await readAllSensorsAsync();
			const names = sensorList.map(id2name);
			return sensorValues.map((sensorValue, id) => ({
				name: names[id],
				id,
				value:parseFloat(sensorValue.toFixed(1))
			})).filter(sensor => sensor.value !== 85);
	},//getStatus
	
	/**
	* @desc Get temp of a single probe.
	* @param {string} name - Probe name.
	*/
	async getTemp(name) {
		try {
			return await readSensorAsync(probeId(name));
		} catch (err) {
			console.log(name);			
		}
	}
}
