/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const kettleHeater = require('./kettle-heater-service.js');

module.exports = {
	getEnergy: kettleHeater.getEnergy,
	getStatus: () => {},
	
	setPower: kettleHeater.setPower,
	
	MAX_W: kettleHeater.MAX_W,
	
	KETTLE_TEMPNAME: 'TempKettle'
}
