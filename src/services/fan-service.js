/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


/**
 * Extractor Fan Driver
 * @module fan
 * @desc Simple on/off control of the extractor fan. Every time the state changes (on/off) an event is emitted to all listeners.
 */

const brewdefs  = require('../brewstack/common/brewdefs.js');
const brewlog   = require('../brewstack/common/brewlog.js');
const i2c       = require('./i2c_raspi-service.js');
const broker 	= require('../broker.js');
const {doublePublish} = require('./mysql-service.js');

const TEMP_FAN_ON = 50;
const TEMP_FAN_OFF = 30;

const POWER = 1000;

/** 
 @const {number} 
 @desc I2C value used to switch OFF the pump.
*/
const FAN_ON = 0;//i2c.LOW;

/** 
 @const {number} 
 @desc I2C value used to switch ON the pump.
*/
const FAN_OFF = 1;//i2c.HIGH;

let currentPower = 0;

/** 
 @const
 @desc Definitions for the fan.
 @property {string} name - Unique fan name.
 @property {number} i2cPinOut - I2C pin number connected to the fan.
 */
const FAN_DEF = {
	/** @type {string} */
	name:"Fan",		
	/** @type {number} */
	i2cPinOut:brewdefs.I2C_FAN_OUTPUT_BIT
}

let publishFanState;
let tempKettleListener;
		
/**
 * Switch fan on or off
 * @param {number} newPower - Watts.
 */
function setState(newPower){
	i2c.writeBit(FAN_DEF.i2cPinOut, (newPower === POWER) ? FAN_ON : FAN_OFF);
	if (newPower !== currentPower){
		if (publishFanState){
			doublePublish(publishFanState, currentPower, newPower);
		}
		currentPower = newPower;
	}
}

const isOn = () => (currentPower === POWER);

/**
 * Automatically switch on/off fan with temperature
 * @param {{name:string, date:number, value:number}} data - Data from sensor.
 */
function tempKettleHandler({value}) {	
	if (value >= TEMP_FAN_ON){
		setState(POWER);
	} else if (value <= TEMP_FAN_OFF){
		setState(0);
	}
}

module.exports = {
    /** 
	 * @returns {string} 
	 */
    isOn,

    /** Turn on the fan.
        @fires fanEvent
     */
    switchOn() {
		setState(POWER);
		return POWER;
    },

    /** Turn off the fan.
        @fires fanEvent
     */
    switchOff() {
		setState(0);
	    return 0;
    },
	
	/**
	 * @desc Add listener to kettle temp and emit fan events when switching on and off. 
	 */
	start(opt) {
		return new Promise((resolve, reject) => {		
			brewlog.debug("fan-service", "Started");
			currentPower = 0;
			i2c.init({number:FAN_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:FAN_OFF});
			
			publishFanState = broker.create(FAN_DEF.name);
			publishFanState(0);
			
			tempKettleListener = broker.subscribe("TempKettle", tempKettleHandler);
			
			resolve(opt);
		});
	},

	/**
	 * @desc Remove kettle temp listener and fan event. 
	 */
	stop() {
		return new Promise((resolve, reject) => {		
			setState(0);
			broker.unSubscribe(tempKettleListener);
			broker.destroy(FAN_DEF.name);
			brewlog.info("fan-service", "Stop");

			resolve();
		});
	},
	
	getStatus: () => currentPower//({name: FAN_DEF.name, value: currentPower})
}
