/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const pump = require('./pump-service.js');
const brewlog = require('../brewstack/common/brewlog.js');
const broker = require('../broker.js');
const therm = require('./temp-service.js');
const glycolHeater = require('./glycol-heater-service.js');
const glycolChiller = require('./glycol-chiller-service.js');
const brewfather = require('./brewfather-service.js');

let _simulationSpeed = null;


const promiseSerial = funcs =>
  funcs.reduce((promise, f) =>
    promise.then(result => f().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))

const doSteps = steps => promiseSerial(steps.map(doStep));

const GLYCOL_TEMPNAME = "TempGlycol";
const FERMENT_TEMPNAME = "TempFermenter";
const AMBIENT_TEMPNAME = "TempAmbient";

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
		timeString += ` ${days} days`;
		timeString += ` ${hour} hours`;
		timeString += ` ${min} mins`;
	}else{
		if (hours > 0){
			timeString += ` ${hours} hours`;
			timeString += ` ${min} mins`;
		}else{
			timeString += ` ${mins} mins`;
			timeString += ` ${sec} secs`;
		}			
	}
console.log(timeString);
	broker.progressPublish(timeString);
}

//Circulate until ferment temp is reached
function pumpOnOff(chillStep, desiredFermentTemp, currentFermentTemp, fermentDone, msToGo2, timeAtTemp, prevTimeAtTemp) {

console.log("pumpOnOff",chillStep,desiredFermentTemp, currentFermentTemp, msToGo2, timeAtTemp, prevTimeAtTemp);
	if (msToGo2 === null) {
		return;
	}

	const reached = (chillStep)
		? currentFermentTemp < (desiredFermentTemp + FERMENTER_OVERSHOOT)
		: currentFermentTemp >= (desiredFermentTemp - FERMENTER_OVERSHOOT);

console.log({reached});

	timeToText(`Fermentation(${desiredFermentTemp}C)=`, msToGo2 / 1000);

	
	if (reached) {
		//Reached ferment temp
		timeAtTemp = process.hrtime();
	        
		const secsAtTemp = hrsecs(timeAtTemp);	
	    const prevSecsAtTemp = hrsecs(prevTimeAtTemp);	
		
		let delta2 = 1000 * (secsAtTemp - prevSecsAtTemp);

		prevTimeAtTemp = timeAtTemp;
		msToGo2 -= delta2;
		msToGo2 = (msToGo2 < 0) ? 0 : msToGo2;
		
		const secsToGo = Math.trunc(msToGo2 / 1000);
		const nsToGo = (msToGo2 * 1E6);
		const hrTime = [secsToGo, nsToGo - (secsToGo * 1E9)];

		pump.off(pump.chillPumpName);

		timeToText(`Fermentation(${desiredFermentTemp}C)=`, hrsecs(hrTime));
		if (msToGo2 <= 0) {
			fermentDone();
		}
	
	
	} else {
		if (chillStep){
			if (currentFermentTemp >= getGlycolTemp()){
				pump.on(pump.chillPumpName);
			}
		}else{
			if (currentFermentTemp < getGlycolTemp()){
				pump.on(pump.chillPumpName);
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
			
			pump.off(pump.chillPumpName);

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
console.log({step});
		const {stepTemp:tempC, stepTime:days} = JSON.parse(step);

		let pumpInterval = null;
		const totalMins = days * 24 * 60 / _simulationSpeed;
		const totalms = totalMins * 60 * 1000;
		let msToGo = totalms;
		let timeAtTemp, prevTimeAtTemp;
		const desiredFermentTemp = parseInt(tempC,10);

		const tempAmbient = await therm.getTemp(AMBIENT_TEMPNAME);
		const chillStep = tempC < tempAmbient;

		pumpInterval = setInterval(() => {
			therm.getTemp(FERMENT_TEMPNAME)
			.then(t => {
console.log(`pumpOnOff:${msToGo}`);
				pumpOnOff(chillStep, desiredFermentTemp, t, (x) => {
					//clearInterval(pumpInterval);
					brewlog.info("Step Complete");
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
		therm.getTemp(FERMENT_TEMPNAME)
		.then(currentFermentTemp => {
			pumpOnOff(chillStep, desiredFermentTemp, currentFermentTemp, resolve, msToGo, timeAtTemp, prevTimeAtTemp);
			therm.getTemp(GLYCOL_TEMPNAME)
			.then(setGlycolTemp);
		});
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

