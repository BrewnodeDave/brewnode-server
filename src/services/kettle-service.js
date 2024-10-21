/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const heater = require('./heater-service.js');

module.exports = {
	getEnergy: heater.getEnergy,
	getStatus: () => {},
	
	setPower: heater.setPower,
	
	MAX_W: heater.MAX_W,
	
	KETTLE_TEMPNAME: 'TempKettle'
}
