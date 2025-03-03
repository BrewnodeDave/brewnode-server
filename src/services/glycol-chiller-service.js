/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const brewdefs  = require('../brewstack/common/brewdefs.js');
const brewlog   = require('../brewstack/common/brewlog.js');
const i2c       = require('./i2c_raspi-service.js');
const broker 	= require('../broker.js');
const {doublePublish} = require('./mysql-service.js');

/** 
 @const {number} 
 @desc I2C value used to switch OFF the pump.
*/
const CHILL_ON = 0;//i2c.LOW;

const POWER = 800;
/** 
 @const {number} 
 @desc I2C value used to switch ON the pump.
*/
const CHILL_OFF = 1;//i2c.HIGH;

/** Current state of the Fan (on/off) */
let currentState = CHILL_OFF;

/** 
 @const
 @desc Definitions for the fan.
 @property {string} name - Unique fan name.
 @property {number} i2cPinOut - I2C pin number connected to the fan.
 */
const CHILL_DEF = {
	name:"GlycolChiller",		
	i2cPinOut:brewdefs.I2C_CHILL_OUTPUT_BIT
}

let publishState;

const statePower = state => state === CHILL_ON ? POWER : 0;

		
/**
 * Switch fan on or off
 * @param {number} state - on or off
 */
function setState(state){
	i2c.writeBit(CHILL_DEF.i2cPinOut, state);	
	doublePublish(publishState, statePower(currentState), statePower(state));
	currentState = state;
	
	return statePower(currentState);
}


module.exports = {
    isOn: () => currentState === CHILL_ON,
    switchOn: () => setState(CHILL_ON),
    switchOff: () => setState(CHILL_OFF),
	
	/**
	 * @desc Add listener to kettle temp and emit fan events when switching on and off. 
	 */
	start: (opt) => new Promise((resolve, reject) => {		
		currentState = CHILL_OFF;
		i2c.init({number:CHILL_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:CHILL_OFF});
		publishState = broker.create(CHILL_DEF.name);

		setState(CHILL_OFF);
		resolve(opt);
	}),
	/**
	 * @desc Remove kettle temp listener and fan event. 
	 */
	stop: () => new Promise((resolve,reject) => {
		broker.destroy(CHILL_DEF.name);
		setState(CHILL_OFF);
		resolve();	
	}),
	
	getStatus: () => statePower(currentState)
	
}
