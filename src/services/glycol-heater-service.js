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
const HEAT_ON = 0;//i2c.LOW;

const POWER = 120;
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
	name:"GlycolHeater",		
	i2cPinOut:brewdefs.I2C_HEAT_OUTPUT_BIT
} 

let publishState;
		
const statePower = state => state === HEAT_ON ? POWER : 0;
/**
 * Switch fan on or off
 * @param {number} state - on or off
 */
function setState(state){
	i2c.writeBit(HEAT_DEF.i2cPinOut, state);
	doublePublish(publishState, statePower(currentState), statePower(state));
	currentState = state;
	
	return statePower(currentState);
}


module.exports = {
    isOn: () => currentState === HEAT_ON,
    switchOn: () => setState(HEAT_ON),
    switchOff: () => setState(HEAT_OFF),
	
	start(opt) {
		return new Promise((resolve, reject) => {		
			currentState = HEAT_OFF;
			i2c.init({number:HEAT_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:HEAT_OFF});
			
			publishState = broker.create(HEAT_DEF.name);
			setState(HEAT_OFF);
			resolve(opt);
		});
	},

	stop() {
		return new Promise((resolve,reject) => {
			broker.destroy(HEAT_DEF.name);

			setState(HEAT_OFF);
			brewlog.info("gylcol-heater.js", "stopped");
			resolve();	
		})
	},
	
	getStatus() {
		setState(currentState);
		if (currentState === HEAT_OFF){
			return 0;//{name: HEAT_DEF.name, value: 0};
		}else if (currentState === HEAT_ON){
			return POWER;//{name: HEAT_DEF.name, value: POWER}
		}
	}
}
