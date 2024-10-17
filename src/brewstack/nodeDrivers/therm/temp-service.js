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
const brewlog = require("../../../brewlog.js");
const broker = require("../../../broker.js");
let PROBES = require('./probes-service.js');

let sampleInterval = null;

let started = false;

function setSampleInterval(secs){
	brewlog.info("setSampleInterval", `${secs} secs`);
	if (sampleInterval !== null){
		clearInterval(sampleInterval);
		sampleInterval = null;
	}

	module.exports.getStatus(true);//.then(console.log);
	
	sampleInterval = setInterval(() => module.exports.getStatus(true)/*.then(console.log)*/, secs * 1000);										
}

module.exports = { 	
	/* Upon initialisation, check that all temperature sensors are found.
	* If not then subsequent temperature measurements will report a fail
	*/
	start(brewOptions) {
		brewlog.info("temp.js","start");
		return new Promise((resolve, reject) => {
			if (started === true){
				resolve(brewOptions);
				return;
			}
			
			if (brewOptions.sim.simulate){
				ds18x20 = require('../../../sim/ds18x20.js');
			}else{
				// @ts-ignore
				ds18x20 = require('ds18x20');
			}
	
			const done = resolve;
			if (sampleInterval === null){
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
								ds18x20.getAll((err, tempObj) => {
									if(err){
										brewlog.error("Failed to get all temperatures", err);
										reject(err);
									}else{
										PROBES.forEach(probe => {
											probe.publishTemp = broker.create(probe.name);
											if (brewOptions.sim.simulate){
												ds18x20.set(probe.name, brewOptions.sim.ambientTemp);
											}
										});
										
										if (brewOptions.sim.simulate){
											setSampleInterval(60 / brewOptions.sim.speedupFactor);
											brewOptions.ambientTemp = brewOptions.sim.ambientTemp;
										}else{
											setSampleInterval(10);
											// const ambientId = PROBES.find(probe => probe.name === 'TempGlycol').id; 
											// brewOptions.ambientTemp = tempObj[ambientId];
										}
										started = true;
										done(brewOptions);
									}
								});
							}
						});//list
					}
				});	
			}//timer null
		});
	},
	
	/**
	* Stop the temperature service.
	*/
	stop() {
		return new Promise((resolve, reject) => {
			if (started === true){
				if (sampleInterval !== null){
					clearInterval(sampleInterval);
				}
				sampleInterval = null;
				
				started = false;
				PROBES.forEach(({name}) => {
					broker.destroy(name);
				});
			}
			brewlog.info("temp.js", "stopped");

			resolve();
		});
	},
	
	setSampleInterval,
	
	/**
	* Emit the current temperature.
	* @desc Only the probes whose temperature has changed will fire an event.
	* @param {boolean} force - Force a status reading regardless of value.
	* @fires temp
	*/
	getStatus(force = false) {
		return new Promise((resolve, reject) => {		
			//brewlog.info("temp.getStatus", `${force}`)
			ds18x20.getAll((err, tempObj) => {
				let result = [];
				if(err){
					// brewlog.critical("Failed to find any temp sensors.", err);
					resolve(result);
				}else{
					PROBES.forEach(probe => {
						for (const key in tempObj){
							if (key == probe.id){					
								const value = tempObj[key];
								const delta = (probe.prevValue === null) ? 0 : probe.prevValue - value;
								
								if (value == 85){
									//85 can be indiciative of an error but not always
									// brewlog.warning(`${probe.name} has maybe failed (85)`);
								}else{
									if ((force === true) || (Math.abs(delta) > 0.5))
									{
										if (probe.publishTemp){
											probe.publishTemp(value);
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
				const probe = PROBES.find(p => p.name === name);
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
