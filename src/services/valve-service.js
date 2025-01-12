/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Valve Module.
 * @module valve
 * @desc This module creates and manages the 8 valves in the system.
 * Each valve has 1 input and 2 outputs. 
 * The input (I2C) causes the valve to open or closes.
 * There is a GPIO output set when the valve is fully closed and fully open.
 * After each open or close command, the state of the valve is verified by waiting upon the valve to indicate that it is open or closed.
 */

const brewdefs = require('../brewstack/common/brewdefs.js');
const brewlog  = require('../brewstack/common/brewlog.js');
const broker   = require('../broker.js');
const {doublePublish} = require('./mysql-service.js');

// @ts-ignore
let i2c = require('./i2c_raspi-service.js');

/** 
 @const {number} 
 @desc I2C value used to OPEN the valve.
*/
const VALVE_OPEN_REQUEST = 0;//i2c.LOW;

/** 
 @const {number} 
 @desc I2C value used to CLOSE the valve.
*/
const VALVE_CLOSE_REQUEST = 1;//i2c.HIGH;		

/** 
 @const
 @desc Definitions for all valves.
 @property {string} name - Unique valve name.
 @property {number} i2cPinOut - I2C pin number used to actuate the valve.
 @property {number} pinOpened - GPIO pin number connected to open signal from the valve.
 @property {number} pinClosed - GPIO pin number connected to close signal from the valve.
*/
const VALVE_DEFS = [{
	name: "ValveFermentIn",//2
	pinOpened: brewdefs.GPIO_VALVE1_OPENED,
	pinClosed: brewdefs.GPIO_VALVE1_CLOSED,
	i2cPinOut: brewdefs.I2C_FERMENTER_VALVE_IN,
	power: 20
}, {
	name: "ValveChillWortIn",//3	
	pinOpened: brewdefs.GPIO_VALVE2_OPENED,
	pinClosed: brewdefs.GPIO_VALVE2_CLOSED,
	i2cPinOut: brewdefs.I2C_CHILL_WORT_VALVE_IN,
	power: 20
}, {
	name: "ValveKettleIn",//6	
	pinOpened: brewdefs.GPIO_VALVE5_OPENED,
	pinClosed: brewdefs.GPIO_VALVE5_CLOSED,
	i2cPinOut: brewdefs.I2C_KETTLE_VALVE_IN,
	power: 0.001 //non-zero implies open status
}, {
	name: "ValveMashIn",	//7
	pinOpened: brewdefs.GPIO_VALVE6_OPENED,
	pinClosed: brewdefs.GPIO_VALVE6_CLOSED,
	i2cPinOut: brewdefs.I2C_MASH_IN_VALVE,
	power: 20
}
];

const valveNames = [];

let timeouts = [];
let _started = false;
let _valves = [];


/**
 * @class Valve
 * @classdesc A pump can be switched on and off. It emits an event every time the state changes to/from on and off. 
 * @param {{name:string, i2cPinOut:number, pinClosed:number, pinOpened:number}} valveDef - Pump name, I2C output & GPIO input pin numbers.
 */
function Valve(valveDef) {
    this.requestPin = null;
	this.name = null;

	const thisValve = this;

	thisValve.power = valveDef.power;
	thisValve.status = 0;
	thisValve.timeout = null;
	thisValve.name = valveDef.name;

	thisValve.requestPin = valveDef.i2cPinOut;
	i2c.setDir(valveDef.i2cPinOut, i2c.DIR_OUTPUT);

	thisValve.publish = broker.create(valveDef.name);

	thisValve.openOrClose = (requested) => {
		
		if ((requested === VALVE_CLOSE_REQUEST) && (thisValve.status === thisValve.power)){
			i2c.writeBit(thisValve.requestPin, requested);
			doublePublish(thisValve.publish, thisValve.status, 0);
			thisValve.status = 0;
		}
		
		if ((requested === VALVE_OPEN_REQUEST) && (thisValve.status === 0)){
			i2c.writeBit(thisValve.requestPin, requested);
			doublePublish(thisValve.publish, thisValve.status, thisValve.power);
			thisValve.status = thisValve.power;
		}
	};

	/**
	 * Open the valve and verify if it has after a few seconds. 
	 */
	thisValve.open = () => thisValve.openOrClose(VALVE_OPEN_REQUEST);

	/**
	 * Close the valve and verify if it has after a few seconds.
	 */
	thisValve.close = () => thisValve.openOrClose(VALVE_CLOSE_REQUEST);
}


module.exports = {
	isStarted: () => _started,
	names: valveNames,

	getStatus: () => _valves.map(valve => {
//Why publish!!!!? To update the UI?
		// valve.publish(valve.status);
		return { 
			name :valve.name, 
			value: valve.status 
		};
	}),
		/**
	 * Open a valve by name
	 * @param {string} name - Valve name
	 */
	open(name) {
		brewlog.info("OPEN", name);
	    const v = _valves.find(valve => (valve.name === name));	
		if (v) {
		  v.open();
		} else {
		  brewlog.error(`Failed to open ${name}`);
		}
		return v.status;
	},

	/** 
	 * Close a valve by name
	 * @param {string} name - Valve name
	 */
	close(name) {
		brewlog.info("CLOSE", name);
	    const v = _valves.find(valve => (valve.name === name));	
		if (v) {
		  v.close();
		} else {
		  brewlog.error(`Failed to close ${name}`);
		}
		return v.status;
	},

	/**
	* Initialize the valve driver and close it. 8 valves are created from initial values.
	*/
	start: (simulationSpeed) =>
		 new Promise((resolve, reject) => {
			_simulationSpeed = simulationSpeed;
			if (_started === true) {
				resolve();
				return;
			}

			const initValue = { dir: i2c.DIR_OUTPUT, value: VALVE_CLOSE_REQUEST };
			
			//i2c must have been started
			_valves = VALVE_DEFS.map(valveDef => {
				const v = new Valve(valveDef);
				valveNames.push(valveDef.name);
			
				initValue.number = v.requestPin;
				i2c.init(initValue);			
				v.close();
				v.status = 0;
				v.publish(v.status);
				return v;
			});
			
			_started = true;
			resolve();
		}),

	stop() {
		return new Promise((resolve, reject) => {
			//remove all timeouts
			timeouts.forEach(timeout => {
				clearTimeout(timeout);
				timeout = null;
			});
			timeouts = [];

			const allClosed = _valves.map(({ close }) => close)
	
			Promise.all(allClosed).then(() => {
				_valves.forEach(({ name }) => {
					broker.destroy(name);
				});
				_started = false;
				brewlog.info("valve.js", "stopped");

				_valves = [];
				resolve();
			});
		});
	},

	selfTest() {
		return new Promise((resolve, reject) => {
			const testAll = _valves.map(valve => valve.selfTest());
			Promise.all(testAll).then(resolve, reject).catch(console.log);
		});
	}
}

