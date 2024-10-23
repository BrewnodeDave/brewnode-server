/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


/**
 * Flow Sensor Driver
 * @module flow
 * @desc Periodically emit the flow rate and total quantity from the flow sensors.
 * The total quantity can be reset to zero at any time.
 * Every sensor has been calibrated individually. This results in each sensor storing the number of mL per pulse for each sensor.
 */
// @ts-ignore
const i2c = require('./i2c_raspi-service.js');
const brewdefs = require('../brewstack/common/brewdefs.js');
const brewlog = require("../brewstack/common/brewlog.js");
const broker = require("../broker.js");

/*
Pulses/Sec = mL/Sec / mL/Puls_
 - A timed fill from the mains gives max flow rate of 200mL/sec
 - Fromd flow dats sheet, mL/pulse=2.25
  - Max Pulses/Sec = 200 / 2.25 = 89
  => Sample period = 11ms
*/
const SAMPLE_PERIOD = 6; //100 times slower in vscode debug


const I2C_FLOW_KETTLE_OUT_MASK	= 1 << brewdefs.I2C_FLOW_KETTLE_OUT;
const I2C_FLOW_MASH_OUT_MASK 	= 1 << brewdefs.I2C_FLOW_MASH_OUT;
const I2C_FLOW_FERMENT_IN_MASK 	= 1 << brewdefs.I2C_FLOW_FERMENT;
const I2C_FLOW_KETTLE_IN_MASK 	= 1 << brewdefs.I2C_FLOW_KETTLE_IN;

/** 
 * @const
 * @desc Interval between flow events
 */
let reportPeriodSecs = null;

let samplePeriodTooSmall = null;
let pulseTimer = null;
let active;
let started = false;
let simInterval = null;
const TIMEOUT_SECS = 10;
let timeoutSecs = null;
				
const ID_FLOW_KETTLE_OUT = 0;
const ID_FLOW_MASH_OUT = 1;
const ID_FLOW_FERMENT_IN = 2;
const ID_FLOW_KETTLE_IN = 3;//????????

const FLOW_DEFS = [
	{
		id: ID_FLOW_KETTLE_IN,
		name:"FlowKettleIn",
		i2cPin:brewdefs.I2C_FLOW_KETTLE_IN,
		mLPerPulse:1.5807,
		k: undefined 	
	},	{
		//when k2m 208mL/s
		id: ID_FLOW_KETTLE_OUT,
		name:"FlowKettleOut",
		i2cPin:brewdefs.I2C_FLOW_KETTLE_OUT,
		mLPerPulse:1.5807,//1.198,//gravity
		k: undefined //0.00557//0.008*1.309	
	},{
		//when m2k 104mL/s
		id: ID_FLOW_MASH_OUT,
		name:"FlowMashOut",
		i2cPin:brewdefs.I2C_FLOW_MASH_OUT,
		mLPerPulse:1.803,
		k: undefined //0.00395//0.008
	},{
		id: ID_FLOW_FERMENT_IN,
		name:"FlowFermentIn",	
		i2cPin:brewdefs.I2C_FLOW_FERMENT,
		mLPerPulse:1.424,//2.9,//1.424,
		k: undefined //0.008
	}
];
const flows = [];
const hrsecs = (hrtime) => hrtime[0] + hrtime[1]/1E9;
	
/**
 * @class Flow
 * @classdesc Each sensor emits a pulse every time a small volume flows through it.  
 * @param {{id:number, name:string, i2cPin:number, mLPerPulse:number, k:number}} opt - Sensor name, I2C pin number and calibrated volume per pulse.
 */
function Flow(opt){
	const thisFlow = this;  

	thisFlow.id = opt.id;
	thisFlow.name = opt.name;
	thisFlow.i2cPin = opt.i2cPin;
	thisFlow.mLPerPulse = opt.mLPerPulse;
	thisFlow.k = opt.k;
	thisFlow.k_init = opt.k;
	thisFlow.mLPerPulse_init = opt.mLPerPulse;
	thisFlow.emitSecs2 = undefined;
	thisFlow.count = 0;
	thisFlow.prevState;
	
	
	thisFlow.rate = 0;//mL/sec
	thisFlow.prevRate = 0;
	thisFlow.last = false;//final transfer after flow has stopped
	
	thisFlow.wait = {
		condition:undefined,
		secs:undefined,
		resolve:undefined,
		secsOfLastChange:undefined,
		metForSecs: 0
	};
	
	thisFlow.publishState = broker.create(thisFlow.name);
		
	thisFlow.prevState = i2c.readBit(thisFlow.i2cPin)

	thisFlow.emit = force => {
		const nowSecs2 = hrsecs(process.hrtime());
		if (!thisFlow.emitSecs2) {
			thisFlow.emitSecs2 = nowSecs2;
		}

		const deltaSecs2 = nowSecs2 - thisFlow.emitSecs2;
		const flow = {
			delta:Math.trunc(thisFlow.prevRate * deltaSecs2), //mL
			rate:Math.trunc(thisFlow.rate)
		};
/*
		if ((force === true) || 
			(flow.delta > 0) || 
			((thisFlow.prevRate !== 0) && (flow.rate === 0)))*/{
			thisFlow.publishState(flow);
			if (thisFlow.prevRate !== flow.rate){
				// brewlog.debug(thisFlow.name, `Flow rate = ${flow.rate} mL/s`);
			}

			thisFlow.emitSecs2 = nowSecs2;
			thisFlow.last = false;
		}

		thisFlow.emitSecs2 = nowSecs2;
		thisFlow.prevRate = flow.rate;
	};
	
	/** 
	 * Periodically emit a flowEvent that contains the current flow rate 
	 * since the previous reset command.
	 */
	thisFlow.reportTimer = setInterval(() => {
		const nowSecs2 = hrsecs(process.hrtime());
		let deltaSecs = nowSecs2 - thisFlow.emitSecs2;
		if (deltaSecs > 0){
			if (thisFlow.k){
				//Non Linear flow
				thisFlow.rate = (thisFlow.k * thisFlow.count*thisFlow.count) / deltaSecs;
			}else{
				thisFlow.rate = (thisFlow.mLPerPulse * thisFlow.count) / deltaSecs;//mL/sec
			}
			
			//Round to nearest 5 mL
			thisFlow.rate = Math.round(thisFlow.rate/5)*5;

//if (thisFlow.id===0) console.log(thisFlow)
		}else{
			deltaSecs = 0;
		}
		//time = null;
		if (thisFlow.count > 0){
			thisFlow.wait.secsOfLastChange = nowSecs2; 
		}
		
		if (thisFlow.last === false){
			//send one last time
			thisFlow.last = true;
		}
		thisFlow.emit(false);	
		
		if (thisFlow.wait.condition){
			//Has condition been met for duration
			if (thisFlow.wait.condition(thisFlow.rate)){
				thisFlow.wait.metForSecs += reportPeriodSecs;
			}
			
			if (thisFlow.wait.metForSecs > thisFlow.wait.secs){
				thisFlow.wait.condition = undefined;
				thisFlow.wait.metForSecs = 0;
				thisFlow.wait.resolve();	
				brewlog.debug("flow done");
			}
			
			if ((nowSecs2 - thisFlow.wait.secsOfLastChange) > timeoutSecs){
				thisFlow.wait.condition = undefined;
				thisFlow.wait.resolve();	
			}
		}			
		thisFlow.count = 0;//reset count every interval

		if (thisFlow.rate != thisFlow.prevRate){
			console.log(thisFlow.name,thisFlow.rate);
		}

	}, reportPeriodSecs*1000);
	
	/**
	* Maintain a count for each bit that has changed.
	* Called every time the flow bit is read.
	*/ 
	thisFlow.bitCount = state => {
		if (thisFlow.prevState != state) {
			thisFlow.count++;
			thisFlow.prevState = state;	
		}
	};
  
	thisFlow.reset = () => {
		brewlog.info(thisFlow.name,"reset........");
		thisFlow.count = 0;
		thisFlow.mLPerPulse = thisFlow.mLPerPulse_init;
		thisFlow.k = thisFlow.k_init;
		thisFlow.emit(true);
	};	

	//wait unitl condition has been met for 'secs'
	thisFlow.waitUpon = (condition, secs, resolve) => {
		brewlog.debug("waitUpon",`${condition}`)
		thisFlow.wait.condition = condition;
		thisFlow.wait.secs = secs;
		thisFlow.wait.resolve = resolve;
		thisFlow.wait.secsOfLastChange = hrsecs(process.hrtime());
	};
}//flow

module.exports = {
	ID_FLOW_KETTLE_OUT,
	ID_FLOW_MASH_OUT,
	ID_FLOW_FERMENT_IN,
	ID_FLOW_KETTLE_IN,//????????

	start(opt) { 
		return new Promise((resolve, reject) => {
			samplePeriodTooSmall = 0;
			//only start once
			if (started === true){
				resolve(opt);
				return;
			}
			
			simInterval = 500 / opt.sim.speedupFactor;
			reportPeriodSecs = opt.flowReportSecs;
			let initValue = {number:undefined, dir:i2c.DIR_INPUT, value:undefined};

			FLOW_DEFS.forEach(flowDef => {
				const f = new Flow(flowDef);	
				initValue.number = flowDef.i2cPin;
				i2c.init(initValue);
				flows[flowDef.id] = f;
				flows[flowDef.id].emit(true);	
			});			
	
			if (pulseTimer){
				clearTimeout(pulseTimer);
				pulseTimer = null;
			}
			active = false;
			
			if (opt.sim.simulate === false){
				timeoutSecs = TIMEOUT_SECS;
				pulseTimer = setInterval(() => {
					//Make this as fast as possible
					if (active == false){
						active = true;

						const word = i2c.getWord();
		// console.log("flow word =", word.toString(16));
						flows[ID_FLOW_KETTLE_OUT].bitCount	((word & I2C_FLOW_KETTLE_OUT_MASK)	>> brewdefs.I2C_FLOW_KETTLE_OUT);
						flows[ID_FLOW_MASH_OUT].bitCount	((word & I2C_FLOW_MASH_OUT_MASK)	>> brewdefs.I2C_FLOW_MASH_OUT); 
						flows[ID_FLOW_FERMENT_IN].bitCount	((word & I2C_FLOW_FERMENT_IN_MASK)	>> brewdefs.I2C_FLOW_FERMENT); 
						flows[ID_FLOW_KETTLE_IN].bitCount	((word & I2C_FLOW_KETTLE_IN_MASK) 	>> brewdefs.I2C_FLOW_KETTLE_IN);
						active = false;
					}else {
						//DONT LOG - takes too long
						samplePeriodTooSmall++;
					}
				}, SAMPLE_PERIOD);
			}else{
				timeoutSecs = TIMEOUT_SECS / opt.sim.speedupFactor;
			}
			started = true;
			resolve(opt);
		});
	},

	/**
	 * Stop the flow service.	
	 */
	stop(opt) {
		return new Promise((resolve, reject) => {
			console.log({samplePeriodTooSmall});	
			samplePeriodTooSmall = null;

			if (started === false){
				resolve(opt);
				return;
			}
			
			active = false;
			clearTimeout(pulseTimer);
			pulseTimer = null;
	
			flows.forEach(flow => {
				broker.destroy(flow.name);		
				clearTimeout(flow.reportTimer);
				flow.reportTimer = null;
			});
			
			started = false;
			brewlog.info("flow.js", "stopped");

			resolve(opt);
		});
	},
/*
	2.1mL/pulse at 7.5L/sec over 0.1s => pulses
	2.1mL/pulse for 0.75L => 750/2.1 pulses

	Each interval = (1000/N)ms
	mL/interval = mLPerSec*(1000/N)
	mL/pulse = mL/interval / (pulses/interval) 
	pulses/interval = mL/pulse  / mLPerSec*(1000/N) = (1000/N)*(mLPerPulse / mLPerSec)

	count = (mL/Pulse) / (mLPerSec/N)
	count = (1/Pulse) / (N/Sec) = secPerPulse / N

	mLPerSec/N = mL/Interval
	pulses/Interval =  (mL/Interval) / (mL/Pulse) = (mLPerSec/N)/mLPerPulse 
	= secsPerPulse / N
*/
	//Simulate a flow rate of mL/Sec by incrementing the count
	//Instead of incrementing by 1 every secsPerPulse,
	//Increment by (1/secsPerPulse) every second.
	//Or by (N/secsPerPulse) every (second/N)
	
	simToggleInterval(flowId, mLPerSec, opt) {
		let pulsesPerSec = mLPerSec / flows[flowId].mLPerPulse;
		let emitTime = process.hrtime();
		let prevemitTime = process.hrtime();
		return setInterval(() => {
			emitTime =  process.hrtime();
			const deltaSecs = (hrsecs(emitTime) - hrsecs(prevemitTime)) * opt.sim.speedupFactor;
			let deltaPulses = (pulsesPerSec * deltaSecs);
			//count is the cumulative number of pulses
			flows[flowId].count += deltaPulses;
			prevemitTime = emitTime;
		}, simInterval);
	},
	
	/**
	 * Fire the flowEvent to broadcast current status.
	 */
	getStatus() {
		let result = [];
		flows.forEach(flow => {
			flow.emit(true);
			result.push({name:flow.name, rate:flow.rate});	
		});	
		return result;
	},
	
    /**
	 * Reset the current total flow volume
     */	
	reset(name) {
		let ok = false;
		flows.forEach(flow => {
			if (flow.name == name){
				flow.reset();
				ok = true;
			}
		});	
		if (!ok){
			brewlog.error("Could not reset flow", name);
		}
	},
	
	getRate(name) {
		let rate;
		flows.forEach(flow => {
			if (flow.name == name){
				rate = flow.rate;
			}
		});	
		return rate;
	},
	
	recalibrate(name, mLPerPulse) {
		let ok = false;
		flows.forEach(flow => {
			if (flow.name === name){
				flow.k = undefined;
				flow.mLPerPulse = mLPerPulse;
				brewlog.info("flow recalibrated",name);
				ok = true;
			}
		});

		if (ok === false){
			brewlog.error("ERROR: FAILED TO RECALIBRATE",	name)
		}
	},
	
	wait(flowName, condition, s) {
		return new Promise((resolve, reject) => {
			let found = false;
			flows.forEach(flow => {
				if (flow.name === flowName){
					flow.waitUpon(condition, s, resolve);
					found = true;
				}
			});
			if (found === false){
				reject(`Could not find flow=${flowName}`);
			}
		});
	}	
}
