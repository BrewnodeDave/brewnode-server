/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Pump Module.
 * @module pump
 * @author Dave Leitch
 * @requires brewdefs
 * @requires brewlog
 * @requires i2c
 * @requires events
 * @requires promise
 * @desc There are two pumps in the system. This module is used to switch them on and off. An event is emitted when the state of the pump changes.
 */
const brewdefs = require('../brewstack/common/brewdefs.js');
const brewlog  = require('../brewstack/common/brewlog.js');
const broker = require('../broker.js');
const i2c = require('./i2c_raspi-service.js');
const {doublePublish} = require('./mysql-service.js');

const POWER = 18;
let started = false;

/** 
 @const {number} 
 @desc I2C value used to switch OFF the pump.
*/
const OFF = 1;//i2c.HIGH;

/** 
 @const {number} 
 @desc I2C value used to switch ON the pump.
*/
const ON = 0;//i2c.LOW;

let mashPump;
let kettlePump;
let chillPump;

const MASH_PUMP = "PumpMash";
const KETTLE_PUMP = "PumpKettle";
const GLYCOL_PUMP = "PumpGlycol";


const pumpStop = pump => {
	if (pump) {
		pump.offSync();
		broker.destroy(pump.name);		
	}
}

/**
 * @class Pump
 * @classdesc A pump can be switched on and off. It emits an event every time the state changes to/from on and off. 
 * @param {string} name - Pump name
 * @param {number} requestPin - I2C pin number	 
 */
function Pump(name, requestPin){
  this.name = name;

  i2c.init({
	number:requestPin, 
	dir:i2c.DIR_OUTPUT, 
	value:OFF
	});
	
  this.state = OFF;
  this.requestPin = requestPin;

  const thisPump = this;  

  this.on = async () => {	
    if (thisPump.state === OFF){
		i2c.writeBit(thisPump.requestPin, ON);
		brewlog.info(this.name,"ON");
		await doublePublish(thisPump.publishState, 0, POWER);
		thisPump.state = ON;
	} 
	return POWER;
  };

  this.onSync = (dutyCycle) => {
	if (thisPump.state === OFF){
		i2c.writeBit(thisPump.requestPin, ON);
		brewlog.info(this.name,"ON");
		doublePublish(thisPump.publishState, 0, POWER);
		thisPump.state = ON;
	}
	return POWER;
  }

	this.off = async () => {	
		if (thisPump.state === ON){
			brewlog.info(this.name,"OFF");
			await doublePublish(thisPump.publishState, POWER, 0);
			thisPump.state = OFF;
		}
		return 0;
	};

  	this.offSync = () => {	
		if (thisPump.state === ON){
			thisPump.state = OFF;
			i2c.writeBit(thisPump.requestPin, OFF);
			brewlog.info(this.name,"OFF Sync");
			doublePublish(thisPump.publishState, POWER, 0);
		}
		return 0;
  	}
}

function on(name){
	if (name === MASH_PUMP){
		return mashPump.onSync();
	}else if (name === KETTLE_PUMP){
		return kettlePump.onSync();
	}else if (name === GLYCOL_PUMP){
		return chillPump.onSync();
  	};
}

function off(name){
	if (name === MASH_PUMP){
		return mashPump.offSync();
	}else if (name === KETTLE_PUMP){
		return kettlePump.offSync();
	}else if (name === GLYCOL_PUMP){
		return chillPump.offSync();
  	};
}	

module.exports = {
	on,
	off,
	ON,
	OFF,
	mashPumpName: MASH_PUMP,
	kettlePumpName: KETTLE_PUMP,
	chillPumpName: GLYCOL_PUMP,
	start(opt) {			
		return new Promise((resolve, reject) => {
			if (started === true){
				resolve(opt);
				return;
			}

			mashPump = new Pump(MASH_PUMP, brewdefs.I2C_MASH_PUMP);
			
			mashPump.publishState = broker.create(MASH_PUMP);
			// mashPump.publishState(0);
			module.exports.mashOnSync = mashPump.onSync;
			module.exports.mashOffSync = mashPump.offSync;
			module.exports.mashOn = mashPump.on;
			module.exports.mashOff = mashPump.off;
			mashPump.offSync();
			
			kettlePump = new Pump(KETTLE_PUMP, brewdefs.I2C_KETTLE_PUMP);
			kettlePump.publishState = broker.create(KETTLE_PUMP);
			// kettlePump.publishState(0);
			module.exports.kettleOn = kettlePump.on;
			module.exports.kettleOnSync = kettlePump.onSync;
			module.exports.kettleOff = kettlePump.off;
			module.exports.kettleOffSync = kettlePump.offSync;
			kettlePump.offSync();

			chillPump = new Pump(GLYCOL_PUMP, brewdefs.I2C_GLYCOL_PUMP);
			chillPump.publishState = broker.create(GLYCOL_PUMP);
			// chillPump.publishState(0);
			module.exports.chillPumpOn = chillPump.on;
			module.exports.chillPumpOnSync = chillPump.onSync;
			module.exports.chillPumpOff = chillPump.off;
			module.exports.chillPumpOffSync = chillPump.offSync;
			chillPump.offSync();
			
			started = true;
			resolve(opt);
		});
	},
	
	stop(opt) {
		return new Promise((resolve, reject) => {
			pumpStop(mashPump);
			pumpStop(kettlePump);
			pumpStop(chillPump);
			started = false;
			brewlog.info("pump.js", "stopped");
			resolve(opt);		
		});
	},
	
	/**
	 * Emit a pump event for all pumps.
	 * @fires pumpEvent
	 */
	getStatus() {
		let result = [];
		let mashState;
		if (mashPump){
			mashState = mashPump.state;
			if (mashState === OFF){
				// mashPump.publishState(0);
				result.push({name:mashPump.name, value:0});
			}
			else if (mashState === ON){
				// mashPump.publishState(POWER);
				result.push({name:mashPump.name, value:POWER});
			}
		}else{
			brewlog.error("getStatus: Mash pump has not been started")
		}
		
		let kettleState;
		if( kettlePump){
			kettleState = kettlePump.state;		
			if (kettleState === OFF){
				// kettlePump.publishState(0);
				result.push({name:kettlePump.name, value:0});
			}
			else if (kettleState === ON){
				// kettlePump.publishState(POWER);
				result.push({name:kettlePump.name, value:POWER});
			}
		}else{
			brewlog.error("getStatus: Kettle pump has not been started")
		}

		let chillState;
		if(chillPump){
			chillState = chillPump.state;		
			if (chillState === OFF){
				// chillPump.publishState(0);
				result.push({name:chillPump.name, value:0});
			}
			else if (chillState === ON){
				// chillPump.publishState(POWER);
				result.push({name:chillPump.name, value:POWER});
			}
		}else{
			brewlog.error("getStatus: Chill pump has not been started")
		}
		
		return result;

	}
}
