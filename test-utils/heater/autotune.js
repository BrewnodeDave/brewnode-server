/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/*
P=1.0182279397020955,I=0.00045118640040693034,D=34.853968400048515
P=1.3483022155116995,I=0.00014885381847995558,D=34.96771268895914
P=1.6179477601615893,I=0.000191795570253339,D=36.218287237945255
P=1.9221754894851337,I=0.0001914925561287659,D=36.21912325683197
*/
const brewDefs = require('../../../brewdefs.js');
const I2c = require('../../nodeDrivers/i2c/i2c_mraa.js');
const pwm = require('./pwm.js');

const therm = require('../../nodeDrivers/therm/temp.js');

const I2cPin = I2c.I2cPin;
const heatOnPin = new I2cPin(brewDefs.kettleI2CPin);


const MAX_POWER_W = 2400;
const PERCENT_POWER = 50;
const PERIOD = 1000 * 30;//mark+space
const SAMPLE_INTERVAL  = 2000;
const CONSTANT_FOR = 50;//num sample intervals



const gLog = new Array();


function heatOff() {
  heatOnPin.write(brewDefs.HEATER_OFF, () => {
	  console.log("heat off");
  });
}
function heatOn() {
  heatOnPin.write(brewDefs.HEATER_ON, () => {
	   console.log("heat on");
  });
}

function powerOn(percent){
	pwm.restart(PERIOD*percent/100, PERIOD*(100-percent)/100);				
}

//Define callbacks
pwm.init(heatOn, heatOff);

// function calcPID(temps){
// 	console.log(temps);
// 	//var time = calcTimes(temps);

// 	const T0 = temps[0].value;
// 	const T1 = temps[temps.length-1].value;
// 	const percentTempChange = (T1 - T0)/T1;
	
// 	const g = percentTempChange / PERCENT_POWER;
	
// 	calcPID2(T1-T0, time.lag);

// }

//http://www.chem.mtu.edu/~tbco/cm416/cctune.html
/*
The system’s response is modeled to a step change as a first order response plus
dead time, using the Cohen-Coon method. From this response, three parameters: K, τ, and
D are founded. K is the output steady state divided by the input step change, τ is the
effective time constant of the first order response, and is D the dead time [9]. 

*/
function calcPID2(T, ambient, lag, m, P){
	const C = 4200;
	const rise = (T-ambient)*m*C/P;
	const g = (T - ambient) / ambient;
	
	const KP = (1/g)  * (rise/lag) * ((4/3) + (lag / (4*rise)));
	const KI = (1/lag)* (13*rise + 8*lag) / (32*rise + 6*lag);
	const KD = lag    * (4*rise) / (11*rise + 2*lag);
	
	console.log(`P=${KP},I=${KI},D=${KD}`);
}
/*
//Rise = time from 28.3% to 63.2% of max
function calcTimes(log){
	var max = log[log.length-1];
	var foundLow = false;
	var foundHigh = false;
	var lower = 0.283 * max;
	var upper = 0.632 * max;
	var highTime = 0;
	var lowTime = 0;
	
	
	log.forEach(function(obj){
		if ((foundLow === false) && (obj.value > lower)){
			lowTime = obj.time;
		}
		if ((foundHigh === false) && (obj.value > upper)){
			highTime = obj.time;
		}
	});
	
	var result = {lag:lowTime,rise:highTime - lowTime};
	
	console.log(result);
	
	return result;
}
*/

//Full power until risen by 10 degrees.
function cohenCoon(m, P){
	therm.temp((err, t) => {
		let timer = null;
		const constant = 0;
		let rising = false;
		const ambient = t;
		let previousTemp = ambient;
		let lag = 0;
		let dT;
		
		heatOn();
		
		const start = Date.now();
		
		timer = setInterval(() => {
			let slope;	
			
			therm.temp((err, actualTemp) => {
				console.log(`temp=${actualTemp},${ambient}`);
				
				if ((rising === false) && ((actualTemp-ambient) >= 0.1)){
					console.log("rising");
					rising = true;
					lag = Date.now() - start;
				}
				dT = actualTemp - ambient;
				//console.log("slope="+slope);
				if (dT >= 10){
					//Done!
					clearTimeout(timer);
					timer = null;
					pwm.stop();
					heatOff();
					
					calcPID2(actualTemp, ambient, lag, m, P);	
				}
				
				previousTemp = actualTemp;
			});
		},SAMPLE_INTERVAL);
	});
}

//5% input (120W) heats up to 80.5
//1% input (24W) heats up to 
const m = 1;//Kg
const P = 3000;//W	
cohenCoon(m, P);

exports.cohenCoon = cohenCoon;