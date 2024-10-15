/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Watchdog Driver.
 * @module wdog
 * @version 0.0.1
 * @author Dave Leitch
 * @requires brewdefs
 * @requires child-process
 * @requires i2c
 * @requires events
 * @desc The watchdog serves two purposes:
 * Indicate that system is running (or not).
 * Manually stop the Pi to avoid corruption before powering off.
 */

const brewDefs = require('../../../brewdefs.js');
const exec = require('child_process').exec;	
const i2c = require('../../nodeDrivers/i2c/i2c_raspi.js');
const brewlog = require('../../../brewlog.js');
const broker = require('../../../broker.js');

/**
 * @const {integer} Watchdog interval
 */
const HEARTBEAT_INTERVAL = 2000;
const WATCHDOG_EVENT_NAME = "Watchdog";

let heartbeat;
let started = false;
let debug = false;

let bark;
let error = false;

module.exports = {
	name:WATCHDOG_EVENT_NAME,
	
	/**
	 * Start the Watchdog service
	 * @desc Initialise I2C bits for LED and button. Monitor both on every heartbeat.
 	*/
	start(opt) {
	 	brewlog.info("Start the Watchdog service");
		return new Promise((resolve, reject) => {
			if (started === true){
				resolve(opt);
				return;
			}
			started = true;
			bark = broker.create(WATCHDOG_EVENT_NAME);
			
			i2c.init({number:brewDefs.I2C_WATCHDOG_LED_BIT,  dir:i2c.DIR_OUTPUT, value:1});
			i2c.init({number:brewDefs.I2C_WATCHDOG_HALT_BIT, dir:i2c.DIR_INPUT});
	
			heartbeat = setInterval(() => {
				//Heartbeat
				i2c.toggleBit(brewDefs.I2C_WATCHDOG_LED_BIT);
				error = false;
				bark("ALIVE");
			
				//Halt upon a button press
				const result = i2c.readBit(brewDefs.I2C_WATCHDOG_HALT_BIT);	
				if ((result == 0) && brewDefs.isRaspPi() && false /*(opt.sim === false)*/){		
					//This event should trigger an attempted controlled shutdown.
					bark("DEAD");
					error = true;
					brewlog.critical("Watchdog Shutdown request!");
					if (debug === false){
						//Need to switch everything off first
						exec("sudo shutdown -h now");
					}
				}
				
			}, HEARTBEAT_INTERVAL);
	
			resolve(opt);
		});
	},
	
	/**
	 * Stop the Watchdog service
 	*/
	stop() {
		brewlog.info("Stop the Watchdog service");
		return new Promise((resolve, reject) => {
			if (started === false){
				resolve();
				return;
			}
			started = false;
			clearInterval(heartbeat);
			heartbeat = null;
			broker.destroy(WATCHDOG_EVENT_NAME);
			brewlog.info("wdog.js", "stopped");

			resolve();
		});
	},

	setDebug(state) {
		debug = state;
		brewlog.info("Watchdog Debug=",state);
	},
	
	getStatus() {	
		return error;	
	}
}
