/**
* Beerware License
* ----------------
* As long as you retain this notice, you can do whatever you want with 
* this stuff. If we meet someday, and you think this stuff is worth it, 
* you can buy me a beer in return.
*/

/**
 * Kettle Heater Driver
 * @module heater
 * @author Dave Leitch
 * @requires brewdefs.js
 * @requires brewlog.js
 * @requires pwm.js
 * @requires i2c.js* @requires events
 * @desc Modulate Kettle heating element to control the power.
 * Every time the state changes an event is emitted to all listeners.
 */
 
const fs = require('fs');
const path = require('path');
 
const brewdefs = require('../../../brewdefs.js');
const broker = require('../../../broker.js');
// const i2c = require('../../nodeDrivers/i2c/i2c_mraa.js');
const i2c = require('../../nodeDrivers/i2c/i2c_raspi-service.js');
const pwm = require('./pwm.js');
const pwm2 = require('./pwm.js');

const MAX_POWER_W = 3000;
const POWER = "power";

//Heater Mark + Space
const PERIOD_INTERVAL_MS = 10 * 1000;

//shortest on/off time
const MIN_ONOFF_MS = 0.5 * 1000;
const MIN_WATTS = (MAX_POWER_W * MIN_ONOFF_MS) / PERIOD_INTERVAL_MS;
const MAX_WATTS = MAX_POWER_W - MIN_WATTS;
let currentPower;
let prevPower = 0;

let publishPower;
let publishHeater;
const energy = function(){
	const filename = path.join(brewdefs.installDir, "energy.txt");
	let currentEnergy = 0;
	function get() {
		if (!fs.existsSync(filename)) {
			set(currentEnergy);
		}
		const txt = fs.readFileSync(filename);
		currentEnergy = parseFloat(txt.toString());
		return currentEnergy;
	}

	function set(e) {
if (e==0) return;
		currentEnergy = e;
		fs.writeFileSync(filename, currentEnergy.toString());
	}

	return {
		add: e => set(get() + e),
		get,
		reset: () => set(0)
	}
}();
/** 
 @const {number} 
 @desc I2C value used to switch OFF the pump.
*/
const HEATER_OFF = 0;//i2c.LOW;

/** 
 @const {number} 
 @desc I2C value used to switch ON the pump.
*/
const HEATER_ON = 1;//i2c.HIGH;

const HEATER_DEF = {
	i2cPinOut:brewdefs.I2C_KETTLE_OUTPUT_BIT
}

//Report power every so often
const UPDATE_INTERVAL = 60 * 1000;

let _simOptions = null; 
let _updateInterval = 1;//Nominally no speed up

/** 
* Turn off the heater.
* @fires heatEvent
*/
const powerOff = () => {
	i2c.writeBit(HEATER_DEF.i2cPinOut, HEATER_OFF);
	
	//Need to stop timer on final 
	pwm.stop();	
	
	if (publishHeater != null){
		publishHeater(0);
	} else{
		console.error("heater powerOff but service not started?");
	}	
};
	
/** 
* Turn on the heater.
* @fires heatEvent
*/
const powerOn = () => {
	i2c.writeBit(HEATER_DEF.i2cPinOut, HEATER_ON);

	if (publishHeater != null){
		publishHeater(1);
	} else{
		console.error("heater powerOn but service not started?");
	}	

};

function getPower(force = false){
	const w = Math.trunc(currentPower);
		
	if ((currentPower != prevPower) || (force === true)) {
		publishPower(currentPower);
		prevPower = currentPower;
	}

	return w;
}	


/**
 * Alternative PWM approach to switching on and off
 * Ensure power is not toggled too quickly
 * @param {Number} watts 
 */
function setPower(watts){

	if (watts >= MAX_POWER_W){//3000
		//Full on
		currentPower = MAX_POWER_W;
	}else 
	if (watts <= 0) {
		//Full off
		currentPower = 0;
	}else 
	if (watts > MAX_WATTS){//2700
		//Off time is too short. Under power to avoid overshoot.
		currentPower = MAX_WATTS;
	}else
	if (watts < MIN_WATTS){//300
		//On time is too short. Under power to avoid overshoot.
		currentPower = 0;
	}else{
		currentPower = watts;
	}
	currentPower = Math.trunc(currentPower);
	
	const mark = currentPower * PERIOD_INTERVAL_MS / MAX_POWER_W;
	const space = PERIOD_INTERVAL_MS - mark;

	//Update the mark and space periods
//	pwm.restart(mark / _simOptions.speedupFactor, space / _simOptions.speedupFactor);	
	pwm.restart(mark , space);	
		
	if (currentPower != prevPower) {	
		// console.log("currentPower=",currentPower);
		publishPower(currentPower);
		prevPower = currentPower;
	}
}

let timer = null;
let ds18x20 = null;

module.exports = {
	getEnergy: energy.get,
	getPower,
	setPower,
		
	start(brewOptions) {
		return new Promise((resolve, reject) => {
			energy.get();
			_simOptions = brewOptions.sim;
			if (brewOptions.sim.simulate){
				ds18x20 = require('../../../sim/ds18x20.js');
			}
			i2c.init({number:HEATER_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:HEATER_OFF});
			currentPower = 0;
			prevPower = 0;
	
			publishPower = broker.create(POWER);
			publishHeater = broker.create("heater");

			//Define callbacks for PWM mark and space functions
			pwm.init(powerOn, powerOff);
	
			_updateInterval = UPDATE_INTERVAL / _simOptions.speedupFactor;
			
			const J2KWHr = j => j / (3600000);
			//Emit the current power to all listeners every 1 minute
			//timer = setInterval(getPower.bind(null, true), _updateInterval);
			timer = setInterval(() => {
				currentPower = getPower(true);
				energy.add(J2KWHr(currentPower * (_updateInterval / 1000)));
			}, _updateInterval);
	
			resolve(brewOptions);
		});
	},

	off: powerOff,
	
	MAX_W : MAX_POWER_W,
	
	stop() {
		return new Promise((resolve, reject) => {		
			pwm.stop();
			powerOff();
			broker.destroy(POWER);
			broker.destroy("heater");
			clearInterval(timer);
			timer = null;
			resolve();
		});
	},
	
	forceOn() {
		i2c.init({number:HEATER_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:HEATER_ON});
		if (publishHeater != null){
			publishHeater(1);
		} else{
			console.error("heater forceOn but service not started?");
		}	
	},
	forceOff() {
		i2c.init({number:HEATER_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:HEATER_OFF});
		if (publishHeater != null){
			publishHeater(0);
		} else{
			console.error("heater forceOff but service not started?");
		}	
	}
}

