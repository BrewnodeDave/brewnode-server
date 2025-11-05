/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const mysqlService = require("./services/mysql-service.js");  

const {create} = require('./broker.js');
const progressPublish = create("Progress");

const logPublish = create('log');

/**
 * @param {String} sensorName
 * @return {Function} Function to be used to publish this event  
 */

 module.exports = {	
    logPublish,
	progressPublish,
	
	remainingFillLitres:create("remainingFillLitres"),
	remainingBoilMinutes: create("remainingBoilMinutes"),
	remainingKettleMinutes: create("remainingKettleMinutes"),
	remainingMashMinutes: create("remainingMashMinutes"),
	remainingFermentDays:create("remainingFermentDays"),

	temperaturePublish: create("temperature"),
	pumpPublish: create("pump"),
	valvePublish: create("valve"),
	sensorPublish: async function(sensorName, oldValue, newValue) {
		if (oldValue !== newValue) {
			await mysqlService.doublePublish(
				(value, timestamp) => this.publish(sensorName, value, timestamp),
				oldValue, 
				newValue
			);
		}
	}
}
