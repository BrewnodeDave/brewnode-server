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
 * @desc Modulate Kettle heating element to control the ater
 * .
 * Every time the state changes an event is emitted to all listeners.
 */
 
const fs = require('fs');
const path = require('path');
 
const brewdefs = require('../brewstack/common/brewdefs.js');
const broker = require('../broker.js');
const i2c = require('./i2c_raspi-service.js');
const pwm = require('../pwm.js');
const brewlog = require('../brewstack/common/brewlog.js');
const {doublePublish} = require('./mysql-service.js');

const MAX_POWER_W = 3000;
const POWER = "Power";

//Heater Mark + Space
const PERIOD_INTERVAL_MS = 10 * 1000;

//shortest on/off time
const MIN_ONOFF_MS = 0.2 * 1000;
const MIN_WATTS = (MAX_POWER_W * MIN_ONOFF_MS) / PERIOD_INTERVAL_MS;
const MAX_WATTS = MAX_POWER_W - MIN_WATTS;
let currentPower;
let prevPower = 0;

let currentHeater = 0;

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

const powerOnOff = (i2cState, power) => {
	i2c.writeBit(HEATER_DEF.i2cPinOut, i2cState);
	if (publishHeater != null){
		if (currentHeater !== power){
			doublePublish(publishHeater, currentHeater, power);
		}
	} else{
		console.error("heater powerOn but service not started?");
	}	
	currentHeater = power;
};

const powerOff = () => powerOnOff(HEATER_OFF, 0);
const powerOn = () => powerOnOff(HEATER_ON, MAX_POWER_W);

function getPower(force = false){
	const w = Math.trunc(currentPower);
		
	if ((currentPower != prevPower) || (force === true)) {
		//publishPower(currentPower);
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
		//OFF time is too short. Under power to avoid overshoot.
		currentPower = MAX_WATTS;
	}else
	if (watts < MIN_WATTS){//300
		//ON time is too short. Under power to avoid overshoot.
		currentPower = 0;
	}else{
		currentPower = watts;
	}
	currentPower = Math.trunc(currentPower);
	
	const mark = currentPower * PERIOD_INTERVAL_MS / MAX_POWER_W;
	const space = PERIOD_INTERVAL_MS - mark;

	pwm.restart(mark , space);	
		
	if (currentPower != prevPower) {	
		doublePublish(publishPower, prevPower, currentPower);
		prevPower = currentPower;
	}
}

module.exports = {
	getPower,
	setPower,
		
	start: (simulationSpeed) =>
		new Promise((resolve, reject) => {
			brewlog.info("kettle-heater-service", "Start");	

			energy.get();
			
			i2c.init({number:HEATER_DEF.i2cPinOut, dir:i2c.DIR_OUTPUT, value:HEATER_OFF});

			currentPower = 0;
			prevPower = 0;
	
			publishPower = broker.create(POWER);
			publishHeater = broker.create("Heater");

			//Define callbacks for PWM mark and space functions
			pwm.init(powerOn, powerOff);
	
			resolve();
		}),

	off: powerOff,
	
	MAX_W : MAX_POWER_W,
	
	async stop() {
		pwm.stop();
		powerOff();
		broker.destroy(POWER);
		broker.destroy("Heater");

		brewlog.info("kettle-heater-service", "stopped");	
	},
	
	forceOn() {
		setPower(MAX_POWER_W);
		return;
		const desiredPower = MAX_POWER_W;
		if (publishHeater != null){
			if (currentHeater !== desiredPower){
				publishHeater(currentHeater);

				i2c.writeBit(HEATER_DEF.i2cPinOut, HEATER_ON);

				setPower(desiredPower);		
				currentHeater = desiredPower;
				publishHeater(currentHeater);
			}
		} else{
			console.error("heater forceOn but service not started?");
		}	
		return currentHeater;
	},

	forceOff() {
		setPower(0);
		return;
		const desiredPower = 0;
		if (publishHeater != null){
			if (currentHeater !== desiredPower){
				publishHeater(currentHeater);
				
				i2c.writeBit(HEATER_DEF.i2cPinOut, HEATER_OFF);

				setPower(desiredPower);
				currentHeater = desiredPower;				
				publishHeater(currentHeater);
			}
		} else{
			console.error("heater forceOff but service not started?");
		}
		return currentHeater;	
	},

	getStatus: () => {
		const heater = i2c.readBit(HEATER_DEF.i2cPinOut);
		currentHeater = heater === HEATER_ON ? MAX_POWER_W : 0;
		return currentHeater;
	}
}

