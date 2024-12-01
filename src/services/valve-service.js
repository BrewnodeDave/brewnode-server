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

// @ts-ignore
let i2c = require('./i2c_raspi-service.js');
let valveSwitchDelay = null;
let opt = null;

const ACTIVE = 1;
const INACTIVE = 0;

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
	i2cPinOut: brewdefs.ValveFermentIn
}, {
	name: "ValveChillWortIn",//3	
	pinOpened: brewdefs.GPIO_VALVE2_OPENED,
	pinClosed: brewdefs.GPIO_VALVE2_CLOSED,
	i2cPinOut: brewdefs.ValveChillWortIn
}, {
	name: "ValveChillCleanOut",//4
	pinOpened: brewdefs.GPIO_VALVE3_OPENED,
	pinClosed: brewdefs.GPIO_VALVE3_CLOSED,
	i2cPinOut: brewdefs.ValveChillCleanOut
}, {
	name: "ValveChillColdIn",//5
	pinOpened: brewdefs.GPIO_VALVE4_OPENED,
	pinClosed: brewdefs.GPIO_VALVE4_CLOSED,
	i2cPinOut: brewdefs.ValveChillColdIn
}, {
	name: "ValveKettleIn",//6	
	pinOpened: brewdefs.GPIO_VALVE5_OPENED,
	pinClosed: brewdefs.GPIO_VALVE5_CLOSED,
	i2cPinOut: brewdefs.ValveKettleIn
}, {
	name: "ValveMashIn",	//7
	pinOpened: brewdefs.GPIO_VALVE6_OPENED,
	pinClosed: brewdefs.GPIO_VALVE6_CLOSED,
	i2cPinOut: brewdefs.ValveMashIn
}, {
	name: "ValveFermentTempIn",//8
	pinOpened: brewdefs.GPIO_VALVE7_OPENED,
	pinClosed: brewdefs.GPIO_VALVE7_CLOSED,
	i2cPinOut: brewdefs.ValveFermentTempIn
}
];

const valveNames = [];

let timeouts = [];
let _started = false;
let _valves = [];



//Set input pins during simulation only
function simSetInputs(thisValve, requested) {
	if (opt.sim.simulate !== true) {
		return;
	}

	//set inputs
	if (requested === VALVE_OPEN_REQUEST) {
		thisValve.status = brewdefs.VALVE_STATUS.OPENED;
	} else if (requested === VALVE_CLOSE_REQUEST) {
		thisValve.status = brewdefs.VALVE_STATUS.CLOSED;
	}
};

/**
 * @class Valve
 * @classdesc A pump can be switched on and off. It emits an event every time the state changes to/from on and off. 
 * @param {{name:string, i2cPinOut:number, pinClosed:number, pinOpened:number}} opt - Pump name, I2C output & GPIO input pin numbers.
 */
function Valve(opt) {
    this.requestPin = null;
	this.name = null;

	const thisValve = this;
	thisValve.status = brewdefs.VALVE_STATUS.CLOSED;
	thisValve.timeout = null;
	thisValve.name = opt.name;

	thisValve.requestPin = opt.i2cPinOut;
	i2c.setDir(opt.i2cPinOut, i2c.DIR_OUTPUT);

	thisValve.publish = broker.create(opt.name);

	thisValve.openOrClose = (requested) => {
		i2c.writeBit(thisValve.requestPin, requested);
		brewlog.info(`thisValve.openOrClose ${thisValve.name}=`, `${requested}`);
		simSetInputs(thisValve, requested);
	};

	/**
	 * Open the valve and verify if it has after a few seconds. 
	 */
	thisValve.open = () => {
		thisValve.openOrClose(VALVE_OPEN_REQUEST);
		thisValve.status = brewdefs.VALVE_STATUS.OPENED;
		thisValve.publish(thisValve.status);
	}

	/**
	 * Close the valve and verify if it has after a few seconds.
	 */
	thisValve.close = () => {
		thisValve.openOrClose(VALVE_CLOSE_REQUEST);
		thisValve.status = brewdefs.VALVE_STATUS.CLOSED;
		thisValve.publish(thisValve.status);
	}
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
		return (v !== undefined);
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
		return (v !== undefined);
	},

	OPENED: brewdefs.VALVE_STATUS.OPENED,
	CLOSED: brewdefs.VALVE_STATUS.CLOSED,

	/**
	* Initialize the valve driver and close it. 8 valves are created from initial values.
	*/
	start(brewOptions) {
		return new Promise((resolve, reject) => {
			opt = brewOptions;
			if (_started === true) {
				resolve(brewOptions);
				return;
			}

			valveSwitchDelay = brewOptions.valveSwitchDelay;
			const initValue = { dir: i2c.DIR_OUTPUT, value: VALVE_CLOSE_REQUEST };
			
			//i2c must have been started
			_valves = VALVE_DEFS.map(valveDef => {
				const v = new Valve(valveDef);
				valveNames.push(valveDef.name);
			
				initValue.number = v.requestPin;
				i2c.init(initValue);
			
				simSetInputs(v, VALVE_CLOSE_REQUEST);
			
				v.close();
				return v;
			});
			
			_started = true;
			resolve(brewOptions);
		});
	},

	stop(opt) {
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
				resolve(opt);
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

