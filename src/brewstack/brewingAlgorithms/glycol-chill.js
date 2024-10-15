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

const {promiseSerial} = require('../../brew-pub.js');

const GLYCOL_TEMPNAME = "TempGlycol";
const FERMENT_TEMPNAME = "TempFermenter";
const FERMENTER_OVERSHOOT = 0;//0.4;//0.1;//0.3;

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
function pumpOnOff(desiredFermentTemp, currentFermentTemp, fermentDone, msToGo, timeAtTemp, prevTimeAtTemp) {	
	if (msToGo === null) {
		return;
	}
		
	if (currentFermentTemp < (desiredFermentTemp + FERMENTER_OVERSHOOT)) {
		//Reached chill temp
		timeAtTemp = process.hrtime();
	        
		const secsAtTemp = hrsecs(timeAtTemp);	
	    const prevSecsAtTemp = hrsecs(prevTimeAtTemp);	
		
		let delta2 = 1000 * (secsAtTemp - prevSecsAtTemp);

		prevTimeAtTemp = timeAtTemp;
		msToGo -= delta2;

		const secsToGo = Math.trunc(msToGo / 1000);
		const nsToGo = (msToGo * 1E6);
		const hrTime = [secsToGo, nsToGo - (secsToGo * 1E9)];
		timeToText("Chilling Step To Go = ", hrTime);
		if (msToGo < 0) {
		    fermentDone();
		}

		pump.chillPumpOffSync();
	} else {
		if (currentFermentTemp > glycolTemp){
			pump.chillPumpOnSync();
		}
	}
}

function glycolChillTempChange(value) {
	glycolTemp = value.value;
}

module.exports = {
	chillStep,
	chillSteps,
	start: function start(opt) {
		return new Promise((resolve, reject) => {
			brewlog.info("glycol-chill.js", "Start")

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
		
	stop: function () {
		return new Promise((resolve, reject) => {				
			//broker.unSubscribe(pumpListener);
			broker.unSubscribe(glycolTempListener);
			
			clearInterval(glycolInterval);
			glycolInterval = null;
			
			pump.chillPumpOffSync();

			brewlog.info("glycol-ferment.js", "stopped");
			resolve();
		});
	}

}


function glycolFermentTempChange(value) {
	brewlog.info("glycolFermentTempChange",value.value);
	glycolTemp = value.value;
}


//This needs to be self contained to allow ferment steps
function chillStep({stepTemp, stepTime}) {
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
				pumpOnOff(desiredFermentTemp, t, (x) => {
					clearInterval(pumpInterval);
					brewlog.info("Chill Step Complete");
					resolve(x);
				}, msToGo, timeAtTemp, prevTimeAtTemp)
			});
		}, 60 * 1000);

		glycolTempListener = broker.subscribe(GLYCOL_TEMPNAME, glycolChillTempChange);

		brewlog.info("glycol-chill.js", `${stepTemp}C for ${stepTime} days`)

		// msTotal = totalms;
		timeAtTemp = process.hrtime();
		prevTimeAtTemp = process.hrtime();

		therm.getTemp(FERMENT_TEMPNAME)
		.then(currentFermentTemp => {
			pumpOnOff(desiredFermentTemp, currentFermentTemp, resolve, msToGo, timeAtTemp, prevTimeAtTemp);
			therm.getTemp(GLYCOL_TEMPNAME).then(t => {
				glycolTemp = t;
			});
		});
	  });
}

function chillSteps(steps) {
	return promiseSerial(steps.map(chillStep));
}