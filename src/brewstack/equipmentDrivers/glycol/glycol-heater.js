/**
 * Extractor Fan Driver
 * @module fan
 * @desc Simple on/off control of the extractor fan. Every time the state changes (on/off) an event is emitted to all listeners.
 */

const brewdefs  = require('../../../common/brewdefs.js');
const brewlog   = require('../../../common/brewlog.js');
const i2c       = require('../../nodeDrivers/i2c/i2c_raspi.js');
const broker 	= require('../../../common/broker.js');

/** 
 @const {number} 
 @desc I2C value used to switch OFF the pump.
*/
const HEAT_ON = 0;//i2c.LOW;

/** 
 @const {number} 
 @desc I2C value used to switch ON the pump.
*/
const HEAT_OFF = 1;//i2c.HIGH;

/** Current state of the Fan (on/off) */
let currentState = HEAT_OFF;

/** 
 @const
 @desc Definitions for the fan.
 @property {string} name - Unique fan name.
 @property {number} i2cPinOut - I2C pin number connected to the fan.
 */
const HEAT_DEF = {
	/** @type {string} */
	name:"GlycolHeater",		
	/** @type {number} */
	i2cPinOut:brewdefs.I2C_HEAT_OUTPUT_BIT
}

let publishState;
		
/**
 * Switch fan on or off
 * @param {number} state - on or off
 */
function setState(state){
	currentState = state;
	i2c.writeBit(HEAT_DEF.i2cPinOut, currentState);
	
	const statefoo = currentState == HEAT_ON ? "ON" : 'OFF';

	brewlog.info("glycol-heater: setState =", `${statefoo}`);

	publishState(statefoo);
}


module.exports = {
    isOn: () => currentState === HEAT_ON,
    switchOn: () => setState(HEAT_ON),
    switchOff: () => setState(HEAT_OFF),
	
	/**
	 * @desc Add listener to kettle temp and emit fan events when switching on and off. 
	 */
	start(opt) {
		return new Promise((resolve, reject) => {		
			currentState = HEAT_OFF;
			i2c.init({number:HEAT_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:HEAT_OFF});
			
			publishState = broker.create(HEAT_DEF.name);
			setState(HEAT_OFF);
			resolve(opt);
		});
	},

	/**
	 * @desc Remove kettle temp listener and fan event. 
	 */
	stop() {
		return new Promise((resolve,reject) => {
			broker.destroy(HEAT_DEF.name);

			setState(HEAT_OFF);
			brewlog.info("gylcol-heater.js", "stopped");
			resolve();	
			// broker.destroy(HEAT_DEF.name);
		})
	},
	
	getStatus() {
		setState(currentState);
		if (currentState === HEAT_OFF){
			return "OFF";
		}else if (currentState === HEAT_ON){
			return "ON";
		}else{
			return "?";
		}
	}
}
