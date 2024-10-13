/**
 * PID Temperature Controller
 * @module tempcontroller
 * @desc As one increases the proportional gain, the system becomes faster, 
but care must be taken not make the system unstable. 
Once P has been set to obtain a desired fast response, 

The integral term is increased to stop the oscillations. 
The integral term reduces the steady state error, 
but increases overshoot. Some amount of overshoot is always 
necessary for a fast system so that it could respond to changes 
immediately. The integral term is tweaked to achieve a minimal 
steady state error. 

Once the P and I have been set to get the desired fast control 
system with minimal steady state error, 
the derivative term is increased until the loop is acceptably 
quick to its set point. Increasing derivative term decreases 
overshoot and yields higher gain with stability but would 
cause the system to be highly sensitive to noise.

*/

const broker = require('../../common/broker.js');
const therm = require('../nodeDrivers/therm/temp.js');
const kettle = require('../equipmentDrivers/kettle/kettle.js');
const phase = require('../brewingAlgorithms/phase.js');

const NanoTimer = require('nanotimer');
const brewlog = require('../../common/brewlog.js');
const mashTimer = new NanoTimer();

//Periodically re-examine temp
const CALCULATION_INTERVAL_MS = 10 * 1000;
let calculationInterval = CALCULATION_INTERVAL_MS;
//Heater Mark + Space

let currentTemp;
let currentPower = null;
//let heatTimer = null;
const heatTimer = new NanoTimer();

let timeAtTemp = 0;
let currentThermName; 

let speedupFactor = 1;
let tempListener;

let Kp = 0;
let Ki = 0;
let Kd = 0;
let targetTemp;
const MAX_P = 3000;
const MAX_I = 1000;
const MAX_D = 1000;
let P = 0;
let I = 0;
let D = 0;
const MAX_TEMP = 97;
let prevError = 0;

let anotherPercent = null;


function limit(value, max){
	if (value > max) {
		return max;
	}
	else if (P < (-1 * max)) {
		return -max;
	}
	else {
		return value;
	}
}

/**
 * Calculate the power required to reach desired temperature 
 * @param {*} actualTemperature 
 * @returns {Number} power
 */
function calculatePower(actualTemperature) {
	const error = targetTemp - actualTemperature;  // Calculate the actual error
 	P = limit(Kp * error, MAX_P);

	I += limit(Ki * error, MAX_I);

	D = limit(Kd * (error - prevError), MAX_D);
	let U = P + I + D;

	if (U < 0) {       // Power cannot be a negative number
		U = 0;              
	}

	prevError = error;    // Save the error for the next loop

	const W = Math.min(Math.max(U, 0), kettle.MAX_W);
	brewlog.info(`delta T=${Math.floor(Math.trunc(error*10)/10)}C. P=${W}W.`);
	return W;
};

function tempHandler(value){
	currentTemp = value.value;
}

function stop(){
	return new Promise((resolve, reject) => {

	pause();
	broker.unSubscribe(tempListener);
	anotherPercent = null;
	kettle.setPower(0);	
	currentPower = 0;
	brewlog.info("pump.js", "stopped");
	resolve();
	})
}

function pause(){
	heatTimer.clearInterval();
	kettle.setPower(0);	
	currentPower = 0;
	mashTimer.clearInterval();
}

function init(name, P, I, D, sim) {
	return new Promise((resolve, reject) => {  
		currentThermName = name;
		brewlog.info("init PID",`${P},${I},${D}`);		
		//Set the PID parameters
		Kp = P;
		Ki = I;
		Kd = D
		brewlog.debug(currentThermName);	
		tempListener = broker.subscribe(currentThermName, tempHandler);
		kettle.setPower(0);
	
		if (sim.simulate){
			speedupFactor = sim.speedupFactor;
			calculationInterval = CALCULATION_INTERVAL_MS / speedupFactor;
		}
		//Force a temperature reading
		brewlog.info("getTemp", currentThermName);
		
		therm.getTemp(currentThermName)
		.then(t => {
			brewlog.info("init PID: Current Temp=",t);
			currentTemp = t;
			resolve(currentTemp);
		});
	  });
}

module.exports = {	
	/** 
	* @desc Initialise PID parameters.
	* @param {number} P - Proportional constant.
	* @param {number} I - Integral constant.
	* @param {number} D - Derivative constant.
	*/	
	init, 	
	getEnergy: kettle.getEnergy,
	
	/**
	* @desc Get current temp of the controller.
	* @returns {number} currentTemp - Probe temp.
	*/
	getTemp() {
		return currentTemp;
	},	
	
	//call every percent change completeness
	registerUpdate(cb) {
		anotherPercent = cb;
	},

	/** 
	* @desc Define temp then update until reached.
	* @param {number} desiredTemp - Desired temp.
	* @param {number} mins - Hold duration.
	*/
	setTemp(desiredTemp, mins) {
		return new Promise((resolve, reject) => {	
			const minutes = Math.trunc(mins * 10) / 10;
			brewlog.debug("setTemp=",`${desiredTemp}, ${minutes}`);
			let minsAtTemp = 0;
			const ms = minutes * 60 * 1000;
			const onePercent = ms / 100;
			targetTemp = Math.round(desiredTemp * 10) / 10;	
			
			let percentComplete = 0;
			let prevPercentComplete = 0;

			const phaseName = `Heating to ${targetTemp}C for ${minutes * speedupFactor} mins.`;

			brewlog.info(phaseName);			
			phase.begin(phaseName, 0, 100);
			if (currentTemp < targetTemp){
				//add heatTimer
				heatTimer.clearInterval();

				heatTimer.setInterval(() => {	
					brewlog.debug("Check kettle temp", `Current:${currentTemp}, Target:${targetTemp}`);
					if (currentTemp >= targetTemp){ 
						//temp reached
						timeAtTemp += calculationInterval;
						if (ms > 0){
							percentComplete = Math.trunc(timeAtTemp * 100 / ms);
							if (percentComplete !== prevPercentComplete){
								if (anotherPercent !== null){
									anotherPercent(percentComplete);
								}
								prevPercentComplete = percentComplete;
							}
						}else{
							percentComplete = 100;
						}
						phase.current(phaseName, percentComplete);
						if (timeAtTemp > ms){
							pause();
							heatTimer.clearInterval();
							phase.end(phaseName);
							resolve();
						}
					}
					if (targetTemp >= MAX_TEMP){
						targetTemp = MAX_TEMP;
						currentPower = kettle.MAX_W;
					}else{
						currentPower = calculatePower(currentTemp);
					}
					kettle.setPower(currentPower);
					
				}, '', `${calculationInterval}m`);
				
			}else{
				//pause();
				resolve();
			}
		});
	},

	setMashTemp(desiredTemp, cb) {
		brewlog.info("setMashTemp=",desiredTemp);
		
		mashTimer.clearInterval();

		targetTemp = Math.round(desiredTemp * 10) / 10;	
				
		const phaseName = `Heating Mash to ${targetTemp}C.`;		
		brewlog.info(phaseName);			
		phase.begin(phaseName, 0, 100);

		//add heatTimer
		mashTimer.setInterval(() => {	
			brewlog.info("Check Mash temp", `${currentTemp}, ${targetTemp}`);
			if (currentTemp >= targetTemp){ 
				//temp reached
				timeAtTemp += calculationInterval;
			}
			currentPower = calculatePower(currentTemp);
			kettle.setPower(currentPower);

			cb({kW:currentPower, secsAtTemp: timeAtTemp/1000});
		}, '', `${calculationInterval}m`);
	},

	pause,
		
	start: 	() => init(kettle.KETTLE_TEMPNAME, 1000, 5, 100, {}),

	stop,
}

