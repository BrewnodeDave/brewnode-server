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
 * Kick-and-hold PWM constants.
 * The valve solenoid receives 100% duty for KICK_MS to ensure it opens,
 * then drops to HOLD_DUTY_PCT to maintain the open state with ~60% less heat.
 */
const KICK_MS       = 200;   // ms at 100% duty to guarantee opening
const HOLD_DUTY_PCT = 40;    // % duty cycle during hold phase
const HOLD_FREQ_HZ  = 25;    // PWM frequency during hold phase (Hz) — 25 Hz gives 16 ms ON / 24 ms OFF, well within setTimeout accuracy

const HOLD_PERIOD_MS  = 1000 / HOLD_FREQ_HZ;                        // 10 ms
const HOLD_ON_MS      = HOLD_PERIOD_MS * (HOLD_DUTY_PCT / 100);     // 4 ms on
const HOLD_OFF_MS     = HOLD_PERIOD_MS - HOLD_ON_MS;                // 6 ms off

/**
 * Per-valve kick-and-hold driver.
 * Starts a 100% kick, then maintains a PWM hold cycle.
 * All timers are stored so they can be cancelled on close().
 */
class ValvePwm {
    constructor(writeBit, pin) {
        this._writeBit    = writeBit;
        this._pin         = pin;
        this._kickTimer   = null;
        this._pwmOnTimer  = null;  // ON phase of each hold cycle
        this._pwmOffTimer = null;  // OFF phase of each hold cycle
        this._running     = false;
    }

    start() {
        this._stop();
        this._running = true;

        // Kick: assert pin HIGH (OPEN) for KICK_MS at 100% duty
        this._writeBit(this._pin, VALVE_OPEN_REQUEST);

        this._kickTimer = setTimeout(() => {
            if (!this._running) return;
            // Transition to hold phase PWM
            this._scheduleCycle();
        }, KICK_MS);
    }

    _scheduleCycle() {
        if (!this._running) return;

        // ON phase
        this._writeBit(this._pin, VALVE_OPEN_REQUEST);

        this._pwmOnTimer = setTimeout(() => {
            this._pwmOnTimer = null;
            if (!this._running) return;

            // OFF phase
            this._writeBit(this._pin, VALVE_CLOSE_REQUEST);

            this._pwmOffTimer = setTimeout(() => {
                this._pwmOffTimer = null;
                this._scheduleCycle();
            }, HOLD_OFF_MS);
        }, HOLD_ON_MS);
    }

    _stop() {
        this._running = false;
        if (this._kickTimer)   { clearTimeout(this._kickTimer);   this._kickTimer   = null; }
        if (this._pwmOnTimer)  { clearTimeout(this._pwmOnTimer);  this._pwmOnTimer  = null; }
        if (this._pwmOffTimer) { clearTimeout(this._pwmOffTimer); this._pwmOffTimer = null; }
    }

    stop() {
        this._stop();
        // Ensure the pin is de-energised when PWM stops
        this._writeBit(this._pin, VALVE_CLOSE_REQUEST);
    }
}

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
	name: "Valve Chiller wort-out",//2
	pinOpened: brewdefs.GPIO_VALVE1_OPENED,
	pinClosed: brewdefs.GPIO_VALVE1_CLOSED,
	i2cPinOut: brewdefs.I2C_FERMENTER_VALVE_IN,
	power: 20
}, {
	name: "Valve Chiller wort-in",//3	
	pinOpened: brewdefs.GPIO_VALVE2_OPENED,
	pinClosed: brewdefs.GPIO_VALVE2_CLOSED,
	i2cPinOut: brewdefs.I2C_CHILL_WORT_VALVE_IN,
	power: 20
}, {
	name: "Valve Kettle-in",//6	
	pinOpened: brewdefs.GPIO_VALVE5_OPENED,
	pinClosed: brewdefs.GPIO_VALVE5_CLOSED,
	i2cPinOut: brewdefs.I2C_KETTLE_VALVE_IN,
	power: 0.001 //non-zero implies open status
}, {
	name: "Valve Mash-in",	//7
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

	// Per-valve kick-and-hold PWM instance
	thisValve._pwm = new ValvePwm((pin, val) => i2c.writeBit(pin, val), thisValve.requestPin);

	thisValve.openOrClose = (requested) => {
		
		if ((requested === VALVE_CLOSE_REQUEST)){
			console.log(`[${new Date().toISOString()}] VALVE CLOSE: ${thisValve.name}`);
			thisValve._pwm.stop();
			doublePublish(thisValve.publish, thisValve.status, 0);
			thisValve.status = 0;
		}
		else
		if ((requested === VALVE_OPEN_REQUEST)){
			console.log(`[${new Date().toISOString()}] VALVE OPEN:  ${thisValve.name}`);
			thisValve._pwm.start();
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

			const allClosed = _valves.map(({ close, _pwm }) => {
				if (_pwm) _pwm.stop();
				return close;
			})
	
			Promise.all(allClosed).then(() => {
				_valves.forEach((v) => {
					v.publish = null;
					broker.destroy(v.name);
					v = null;
				});
				_started = false;
				brewlog.warn("valve.js", "stopped");

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

