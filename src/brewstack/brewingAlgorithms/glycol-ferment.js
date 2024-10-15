/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const pump = require('../equipmentDrivers/pump/pump.js');
const brewlog = require('../../brewlog.js');
const broker = require('../../broker.js');
const therm = require('../nodeDrivers/therm/temp.js');
const glycolHeater = require('../equipmentDrivers/glycol/glycol-heater.js');
const {promiseSerial} = require('../../brew-pub.js');

const GLYCOL_TEMPNAME = "TempGlycol";
const FERMENT_TEMPNAME = "TempFermenter";
const FERMENTER_OVERSHOOT = 0;//0.1;//0;//0.4;//0.1;//0.3;

let glycolTemp;

let glycolInterval = null;

const hrsecs = hrtime => hrtime[0] + hrtime[1] / 1E9;

let glycolTempListener;

function timeToText(prefix, hrTime){
	const secs = hrsecs(hrTime);
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

	brewlog.info(timeString);
}

//Circulate until ferment temp is reached
function circulate(desiredFermentTemp, currentFermentTemp, fermentDone, msToGo, timeAtTemp, prevTimeAtTemp) {
	brewlog.info("ferment pumpOnOff", currentFermentTemp);
	
	if (msToGo === null) {
		return;
	}

	if (currentFermentTemp >= (desiredFermentTemp - FERMENTER_OVERSHOOT)) {
		//Reached ferment temp
		timeAtTemp = process.hrtime();
	        
		const secsAtTemp = hrsecs(timeAtTemp);	
	    const prevSecsAtTemp = hrsecs(prevTimeAtTemp);	
		
		let delta2 = 1000 * (secsAtTemp - prevSecsAtTemp);

		prevTimeAtTemp = timeAtTemp;
		msToGo -= delta2;

		const secsToGo = Math.trunc(msToGo / 1000);
		const nsToGo = (msToGo * 1E6);
		const hrTime = [secsToGo, nsToGo - (secsToGo * 1E9)];
		timeToText("Fermentation Step To Go = ", hrTime);
		if (msToGo < 0) {
		    fermentDone();
		}

		pump.chillPumpOffSync();
	} else {
		if (currentFermentTemp < glycolTemp){
			pump.chillPumpOnSync();
		}
	}
}


function glycolFermentTempChange(value) {
	brewlog.info("glycolFermentTempChange",value.value);
	glycolTemp = value.value;
}

module.exports = {
	start: function start(opt) {
		return new Promise((resolve, reject) => {
			brewlog.info("glycol-ferment.js", "START")
			
			therm.getTemp(GLYCOL_TEMPNAME)
			.then(t => {
				glycolTemp = t;					
				const getFermentTemp = () => therm.getTemp(FERMENT_TEMPNAME);

				getFermentTemp()
				.then(currentFermentTemp => {
					resolve(opt); 
				});
			});
		});
	},

	fermentStep,

	fermentSteps,

	stop: function () {
		return new Promise((resolve, reject) => {				
			broker.unSubscribe(glycolTempListener);
			
			clearInterval(glycolInterval);
			glycolInterval = null;
			
			glycolHeater.switchOff();
			
			pump.chillPumpOffSync();

			brewlog.info("glycol-ferment.js", "stopped");
			resolve();
		});
	}
}

//This needs to be self contained to allow ferment steps
function fermentStep({stepTemp, stepTime}) {
	return () => 
	  new Promise((resolve, reject) => {
		let pumpInterval = null;
		const totalMins = stepTime * 24 * 60;
		const totalms = totalMins * 60 * 1000;
		let msToGo = totalms;
		let timeAtTemp, prevTimeAtTemp;
		const desiredFermentTemp = parseInt(stepTemp,10);

		pumpInterval = setInterval(() => {
			therm.getTemp(FERMENT_TEMPNAME)
			.then(t => {
				circulate(desiredFermentTemp, t, (x) => {
					clearInterval(pumpInterval);
					brewlog.info("Ferment Step Complete");
					resolve(x);
				}, msToGo, timeAtTemp, prevTimeAtTemp)
			});
		}, 60 * 1000);

		glycolTempListener = broker.subscribe(GLYCOL_TEMPNAME, glycolFermentTempChange);

		glycolInterval = maintainGlycolTemp(desiredFermentTemp);

		// msTotal = totalms;
		timeAtTemp = process.hrtime();
		prevTimeAtTemp = process.hrtime();

		therm.getTemp(FERMENT_TEMPNAME)
		.then(currentFermentTemp => {
			circulate(desiredFermentTemp, currentFermentTemp, resolve, msToGo, timeAtTemp, prevTimeAtTemp);
			therm.getTemp(GLYCOL_TEMPNAME).then(t => {
				glycolTemp = t;
			});
		});
	  });
}

function fermentSteps(steps) {
	return promiseSerial(steps.map(fermentStep));
}


function maintainGlycolTemp(temp) {
	const desiredTemp = parseInt(temp,10)+10
	const targetTemp = Math.round(desiredTemp * 10) / 10;	
    brewlog.info(`maintainGlycolTemp=${desiredTemp}`);
	
	return setInterval(() => (glycolTemp >= targetTemp) 
		? glycolHeater.switchOff() 
		: glycolHeater.switchOn()
	, 60 * 1000);
}

