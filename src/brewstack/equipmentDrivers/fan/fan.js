/**
 * Extractor Fan Driver
 * @module fan
 * @desc Simple on/off control of the extractor fan. Every time the state changes (on/off) an event is emitted to all listeners.
 */

const brewdefs  = require('../../../common/brewdefs.js');
const brewlog   = require('../../../common/brewlog.js');
//const i2c       = require('../../nodeDrivers/i2c/i2c_mraa.js');
const i2c       = require('../../nodeDrivers/i2c/i2c_raspi.js');
const broker 	= require('../../../common/broker.js');

const TEMP_FAN_ON = 50;
const TEMP_FAN_OFF = 30;

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

/** Current state of the Fan (on/off) */
let currentState = FAN_OFF;

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
 * @param {number} state - on or off
 */
function setState(state){
	currentState = state;
	i2c.writeBit(FAN_DEF.i2cPinOut, currentState);
	
	if (publishFanState){
		if (currentState == FAN_ON){
			publishFanState("ON");
		}else{
			publishFanState("OFF");
		}
	}
}

/** 
* @returns {boolean} currentState. 
*/
function isOn() {
    return (currentState === FAN_ON);
}

/**
 * Automatically switch on/off fan with temperature
 * @param {{name:string, date:number, value:number}} data - Data from sensor.
 */
function tempKettleHandler({value}) {
	const temp = value;
	const fanOn = isOn();
	if ((temp <= TEMP_FAN_OFF) && fanOn) {
		setState(FAN_OFF);
	} else 
	if ((temp >= TEMP_FAN_ON) && !fanOn) {
		setState(FAN_ON);
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
		if (!isOn()) {
			setState(FAN_ON);
	    }
    },

    /** Turn off the fan.
        @fires fanEvent
     */
    switchOff() {
		if (isOn()) {
			setState(FAN_OFF);
	    }
    },
	
	/**
	 * @desc Add listener to kettle temp and emit fan events when switching on and off. 
	 */
	start(opt) {
		return new Promise((resolve, reject) => {		
			brewlog.info("fan started");
			currentState = FAN_OFF;
			i2c.init({number:FAN_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:FAN_OFF});
			brewlog.info("i2c init");
			publishFanState = broker.create(FAN_DEF.name);
			brewlog.info("pub fan state");
			publishFanState("OFF");
			brewlog.info("fan TempKettle");
			tempKettleListener = broker.subscribe("TempKettle", tempKettleHandler);
			resolve(opt);
		});
	},

	/**
	 * @desc Remove kettle temp listener and fan event. 
	 */
	stop() {
		return new Promise((resolve, reject) => {		
			setState(FAN_OFF);
			broker.unSubscribe(tempKettleListener);
			broker.destroy(FAN_DEF.name);
			brewlog.info("fan.js", "stopped");

			resolve();
		});
	},
	
	getStatus() {
		setState(currentState);
		if (currentState === FAN_OFF){
			return "OFF";
		}else if (currentState === FAN_ON){
			return "ON";
		}else{
			return "?";
		}
	}
}
