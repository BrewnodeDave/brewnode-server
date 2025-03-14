/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

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

const broker = require('../broker.js');
const therm = require('./temp-service.js');
const kettleHeater = require('./kettle-heater-service.js'); 

const NanoTimer = require('nanotimer');
const brewlog = require('../brewstack/common/brewlog.js');

let _simulationSpeed = 1;
const mashTimer = new NanoTimer();

//Periodically re-examine temp
const CALCULATION_INTERVAL_MS = 10 * 1000;
let calculationInterval = CALCULATION_INTERVAL_MS;
//Heater Mark + Space

let currentTemp;
let currentPower = null;
const heatTimer = new NanoTimer();

let timeAtTemp = 0;
let currentThermName = "TempKettle"; 

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

	const W = Math.min(Math.max(U, 0), kettleHeater.MAX_W);
	// brewlog.info(`delta T=${Math.floor(Math.trunc(error*10)/10)}C. P=${W}W.`);
	return W;
};

function tempHandler(value){
	currentTemp = value.value;
}


function pause(){
	heatTimer.clearInterval();
	kettleHeater.setPower(0);	
	currentPower = 0;
	mashTimer.clearInterval();
}

function init(P, I, D) {
	return new Promise((resolve, reject) => {  
		brewlog.info("init PID",`${P},${I},${D}`);		
		//Set the PID parameters
		Kp = P;
		Ki = I;
		Kd = D
		brewlog.debug(currentThermName);	
		kettleHeater.setPower(0);
	
		if (_simulationSpeed !== 1){
			calculationInterval = CALCULATION_INTERVAL_MS / _simulationSpeed;
		}
		//Force a temperature reading
		brewlog.info("getTemp", currentThermName);
		
		therm.getTemp(currentThermName)
		.then(t => {
			brewlog.info("init PID: Current Temp=",t);
			currentTemp = t;
			resolve(currentTemp);
		}, err => {
			reject(err);
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
	
	/**
	* @desc Get current temp of the controller.
	* @returns {number} currentTemp - Probe temp.
	*/
	getTemp() {
		return currentTemp;
	},	
	
	/** 
	* @desc Define temp then update until reached.
	* @param {number} desiredTemp - Desired temp.
	* @param {number} mins - Hold duration.
	*/
	setTemp(desiredTemp, mins, remaining) {
		return new Promise((resolve, reject) => {	
			const minutes = Math.trunc(mins * 10) / 10;
			brewlog.debug("setTemp=",`${desiredTemp}, ${minutes}`);
			const ms = minutes * 60 * 1000;
			targetTemp = Math.round(desiredTemp * 10) / 10;	
			
			const phaseName = `Heating to ${targetTemp}C for ${minutes * speedupFactor} mins.`;

			brewlog.info(phaseName);			
			// if (currentTemp < targetTemp){
				//add heatTimer
				heatTimer.clearInterval();
				timeAtTemp = 0;

				heatTimer.setInterval(() => {	
					brewlog.debug("Check kettle temp", `Current:${currentTemp}, Target:${targetTemp}`);
					if (currentTemp >= targetTemp){ 
						//temp reached
						timeAtTemp += calculationInterval;
						if (ms > 0){
							remaining(Math.trunc(speedupFactor*(mins - (timeAtTemp / 60000))));
						}

						if (timeAtTemp > ms){
							pause();
							heatTimer.clearInterval();
							resolve();
						}
					}
					if (targetTemp >= MAX_TEMP){
						targetTemp = MAX_TEMP;
						currentPower = kettleHeater.MAX_W;
					}else{
						currentPower = calculatePower(currentTemp);
					}
					kettleHeater.setPower(currentPower);
					
				}, '', `${calculationInterval}m`);
				
			// }else{
			// 	//pause();
			// 	resolve();
			// }
		});
	},

	setMashTemp(desiredTemp, cb) {
		brewlog.info("setMashTemp=",desiredTemp);
		
		mashTimer.clearInterval();

		targetTemp = Math.round(desiredTemp * 10) / 10;	
				
		const phaseName = `Heating Mash to ${targetTemp}C.`;		
		brewlog.info(phaseName);			

		//add heatTimer
		mashTimer.setInterval(() => {	
			brewlog.info("Check Mash temp", `${currentTemp}, ${targetTemp}`);
			if (currentTemp >= targetTemp){ 
				//temp reached
				timeAtTemp += calculationInterval;
			}
			currentPower = calculatePower(currentTemp);
			kettleHeater.setPower(currentPower);

			cb({kW:currentPower, secsAtTemp: timeAtTemp/1000});
		}, '', `${calculationInterval}m`);
	},

	pause,
		
	start: (simulationSpeed) => {
		_simulationSpeed = simulationSpeed;
		brewlog.info("temp-controller-service", "Start");
		tempListener = broker.subscribe(currentThermName, tempHandler);
		return init(1000, 5, 100);
	},

	stop: () => {
		_simulationSpeed = 1;
		brewlog.info("temp-controller-service", "Stop");
		pause();
		broker.unSubscribe(tempListener);
		broker.unSubscribe(tempListener);
	},
}

