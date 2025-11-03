/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const pumps = require('./pump-service.js');
const brewlog = require('../brewstack/common/brewlog.js');
const broker = require('../broker.js');
const therm = require('./temp-service.js');
const glycolHeater = require('./glycol-heater-service.js');
const glycolChiller = require('./glycol-chiller-service.js');
const brewfather = require('./brewfather-service.js');

let _simulationSpeed = null;


/**
 * Executes an array of functions that return promises in series, ensuring
 * that each function is executed only after the previous one has resolved.
 * The results of each promise are collected into a single array.
 *
 * @param {Array<Function>} funcs - An array of functions, each returning a promise.
 * @returns {Promise<Array>} A promise that resolves to an array containing the results
 * of all the promises, in the same order as the input functions.
 */
const promiseSerial = funcs =>
  funcs.reduce((promise, f) =>
    promise.then(result => f().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))

const doSteps = steps => promiseSerial(steps.map(doStep));

const GLYCOL_TEMPNAME = "Temp Glycol";
const FERMENT_TEMPNAME = "Temp Fermenter";
const AMBIENT_TEMPNAME = "Temp Ambient";

const FERMENTER_OVERSHOOT = 0.1;//0;//0.1;//0;//0.4;//0.1;//0.3;

let glycolTempListener;
let glycolInterval = null;

let glycolTemp;
const setGlycolTemp = t => {
	glycolTemp = t;
}		
const getGlycolTemp = () => {
	return glycolTemp;
}			

const glycolFermentTempChange = value => setGlycolTemp(value);
				
const hrsecs = hrtime => hrtime[0] + hrtime[1] / 1E9;

function timeToText(prefix, secs){
	const mins = Math.trunc(secs / 60);
	const hours = Math.trunc(secs / (60 * 60));
	const days = Math.trunc(secs / (60 * 60 * 24));

	let timeString = prefix;
        const MINS_PER_HOUR = 60;
        const SECS_PER_MIN = 60;
        const HOURS_PER_DAY = 24;
        const hour = Math.trunc(hours - (days  * HOURS_PER_DAY));
        const min = Math.trunc(mins  - (hours * MINS_PER_HOUR));
        const sec = Math.trunc(secs  - (mins  * SECS_PER_MIN));
	if (days > 0){
		timeString += ` ${days} d`;
		timeString += ` ${hour} h`;
		timeString += ` ${min} m`;
	}else{
		if (hours > 0){
			timeString += ` ${hours} h`;
			timeString += ` ${min} m`;
		}else if (mins > 0){
			timeString += ` ${mins} m`;
		} else {
			timeString += ` ${sec} s`;
		}			
	}
	console.log(timeString);
	broker.progressPublish(timeString);
}

//Circulate until ferment temp is reached
function pumpOnOff(chillStep, desiredFermentTemp, currentFermentTemp, fermentDone, msToGo2, timeAtTemp, prevTimeAtTemp) {

	console.log("pumpOnOff",{chillStep},{desiredFermentTemp}, {currentFermentTemp}, {msToGo2}, {timeAtTemp}, {prevTimeAtTemp});
	if (msToGo2 === null) {
		return;
	}

	const reached = (chillStep)
		? currentFermentTemp < (desiredFermentTemp + FERMENTER_OVERSHOOT)
		: currentFermentTemp >= (desiredFermentTemp - FERMENTER_OVERSHOOT);
console.log({reached},{chillStep});
	const secsToGo = Math.trunc(msToGo2 / 1000);
	const nsToGo = (msToGo2 * 1E6);
	const hrTime = [secsToGo, nsToGo - (secsToGo * 1E9)];
	// timeToText(`Fermentation(${desiredFermentTemp}C)=`, hrsecs(hrTime));

	
	if (reached) {
		//Reached ferment temp
		timeAtTemp = process.hrtime();
	        
		const secsAtTemp = hrsecs(timeAtTemp);	
	    const prevSecsAtTemp = hrsecs(prevTimeAtTemp);	
		
		let delta2 = 1000 * (secsAtTemp - prevSecsAtTemp);

		prevTimeAtTemp = timeAtTemp;
		msToGo2 -= delta2;
		msToGo2 = (msToGo2 < 0) ? 0 : msToGo2;
		

		pumps.off(pumps.chillPumpName);

		const secsToGo = Math.trunc(msToGo2 / 1000);
		const nsToGo = (msToGo2 * 1E6);
		const hrTime = [secsToGo, nsToGo - (secsToGo * 1E9)];
		timeToText(`Ferment(${desiredFermentTemp}C)=`, hrsecs(hrTime));
		if (msToGo2 <= 0) {
			console.log("Fermentation Step Done");
			fermentDone();
		}
	
	
	} else {
		if (chillStep){
			if (currentFermentTemp >= getGlycolTemp()){
				pumps.on(pumps.chillPumpName);
			}
		}else{
			if (currentFermentTemp < getGlycolTemp()){
				pumps.on(pumps.chillPumpName);
			}
		}
	}


}

module.exports = {
	doSteps,

	start: function start(simulationSpeed) {
		_simulationSpeed = simulationSpeed;
		return new Promise((resolve, reject) => {
			therm.getTemp(GLYCOL_TEMPNAME)
			.then(t => {
				setGlycolTemp(t);
				const getFermentTemp = () => therm.getTemp(FERMENT_TEMPNAME);

		        glycolTempListener = broker.subscribe(GLYCOL_TEMPNAME, glycolFermentTempChange);
				
				getFermentTemp()
				.then(resolve);
			}, reject);
		});
	},

	stop: function () {
		return new Promise((resolve, reject) => {	
			_simulationSpeed = null;
			broker.unSubscribe(glycolTempListener);
			
			clearInterval(glycolInterval);
			glycolInterval = null;
			
			glycolHeater.switchOff();
			
			pumps.off(pumps.chillPumpName);

			// brewfather.stop();
			brewlog.info("glycol-ferment.js", "stopped");
			resolve();
		});
	},
}

//This needs to be self contained to allow ferment steps
function doStep(step) {	
	return () => 
	  new Promise(async (resolve, reject) => {
console.log('New Step:',{step});
		const {stepTemp:tempC, stepTime:days} = JSON.parse(step);

		let pumpInterval = null;
		const totalMins = days * 24 * 60 / _simulationSpeed;
		const totalms = totalMins * 60 * 1000;
		let msToGo = totalms;
		let timeAtTemp, prevTimeAtTemp;
		const desiredFermentTemp = parseInt(tempC,10);

		const tempAmbient = await therm.getTemp(AMBIENT_TEMPNAME);
		const glycolTemp = await therm.getTemp(GLYCOL_TEMPNAME);
		const fermentTemp = await therm.getTemp(FERMENT_TEMPNAME);
		const chillStep = (desiredFermentTemp < tempAmbient); 

		pumpInterval = setInterval(() => {
			therm.getTemp(FERMENT_TEMPNAME)
			.then(t => {
				pumpOnOff(chillStep, desiredFermentTemp, t, (x) => {
					//clearInterval(pumpInterval);
					brewlog.info("Step Complete");
					clearInterval(glycolInterval);
					clearInterval(pumpInterval);

					glycolInterval = null;
					glycolChiller.switchOff();
					glycolHeater.switchOff();
					pumps.off(pumps.chillPumpName);

					resolve(x);
				}, msToGo, timeAtTemp, prevTimeAtTemp)
			});
		}, 60 * 1000 / _simulationSpeed);

		//glycolTempListener = broker.subscribe(GLYCOL_TEMPNAME, glycolFermentTempChange);
		if (chillStep) {
console.log("CHILL", {tempC}, {tempAmbient}, {glycolTemp});
				glycolChiller.switchOn();
				clearInterval(glycolInterval);
				glycolHeater.switchOff();
		}else{
			const reached  = fermentTemp >= (desiredFermentTemp - FERMENTER_OVERSHOOT);
console.log("HEAT", {tempC}, {tempAmbient}, {glycolTemp});
			glycolChiller.switchOff();
			glycolInterval = maintainGlycolTemp(desiredFermentTemp);			
		}

		// msTotal = totalms;
		timeAtTemp = process.hrtime();
		prevTimeAtTemp = process.hrtime();

		//**********
		// ????????????
		// still needed ???? */
		// therm.getTemp(FERMENT_TEMPNAME)
		// .then(currentFermentTemp => {
		// 	pumpOnOff(chillStep, desiredFermentTemp, currentFermentTemp, resolve, msToGo, timeAtTemp, prevTimeAtTemp);
		// 	therm.getTemp(GLYCOL_TEMPNAME)
		// 	.then(setGlycolTemp);
		// });
	  });
}

function maintainGlycolTemp(temp) {
	const desiredTemp = parseInt(temp,10)+10;
	const targetTemp = Math.round(desiredTemp * 10) / 10;	
    brewlog.info(`maintainGlycolTemp=${desiredTemp}`);
	
	return setInterval(() => (getGlycolTemp() >= targetTemp) 
		? glycolHeater.switchOff() 
		: glycolHeater.switchOn()
	, 60 * 1000 / _simulationSpeed);
}

