/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

//import { hostname } from 'os';

/**
 * Simulation of the brewery environment.
 * @module sim
 * @desc This module is used to run and test all brewery software in the absence of any 
 * brewery hardware. 
 * This is mainly done by subscribing to Pump and Valve events in order to stimulate flows and temperatures.
 * In order to artificially stimulate these sensors, both the ds18x20 and mraa modules needed
 * to be replaced for the simulation. All other modules remain the same during the simulation as
 * they do on the hardware.
 * Environmental effects modelled include:
 * 1) Heating of water
 * 2) Flow rates.
 * 3) Fluid temperatures
 * 4) Vessel cooling
 * 5) Vessel evaporation
 */
const path = require('path');
const logDir = path.join(__dirname, "../brewstack/equipmentDrivers");

const broker = require('../broker.js');
const pump = require('../brewstack/equipmentDrivers/pump/pump.js');
const valve = require('../brewstack/equipmentDrivers/valve/valve.js');
const ds18x20 = require('./ds18x20.js');
const flow = require('../brewstack/equipmentDrivers/flow/flow.js');
const brewdefs = require('../brewdefs.js');
const kettle = require('../brewstack/equipmentDrivers/kettle/kettle.js');
const mashTun = require('../brewstack/equipmentDrivers/mashtun/mashtun.js');
const temp = require('../brewstack/nodeDrivers/therm/temp.js');
const brewlog = require('../brewlog.js');

const CHILLER_OUTPUT_TEMP = 20;
const FLOW_RATE = 200;
const KETTLE_TEMP = "TempKettle";
const MASHTUN_TEMP = "TempMash";
const FERMENTER_TEMP = "TempFermenter";


let _opt = null;
const fs = require('fs');

//read last entry e.g "2018-04-23 23:07:59 INFO  25"
function getVolume(logFile){	
	return new Promise((resolve, reject) => {	
        if (!fs.existsSync(logFile)) {
            // Create the file if it doesn't exist and write '0' to it
            fs.writeFileSync(logFile, '0');
        }

		const rl = require('readline').createInterface({
			input: require('fs').createReadStream(logFile)
		});
	
		let value;
	
		rl.on('line', line => {
            value  = parseFloat(line);
		});
	
		rl.on('close', () => {
			resolve(value);		
		});
	});
}

let simState = {
    PumpMash:           "OFF",
    PumpKettle:         "OFF",
    TempKettle:         0,
    TempMash:           0,
    TempFermentIn:      0,
    TempFermenter:      0,
    TempKettleOut:      0,
    TempFermenterTemp:  0,//=TempKettleOut when valveFermentTempIn is open
    valveFermentTempIn: brewdefs.VALVE_STATUS.CLOSED,
    valveMashIn:        brewdefs.VALVE_STATUS.CLOSED,
    valveFermentIn:     brewdefs.VALVE_STATUS.CLOSED,
    valveChillWortIn:   brewdefs.VALVE_STATUS.CLOSED,
    valveKettleIn:      brewdefs.VALVE_STATUS.CLOSED,
    power:              0,
    prevPower:          0,
    readKettleVolume:   getVolume(path.resolve(logDir, "Kettle-vol.txt")),
    readMashVolume:     getVolume(path.resolve(logDir, "Mash-vol.txt")),
    readFermenterVolume:getVolume(path.resolve(logDir, "Fermenter-vol.txt")),
    KettleVolume:       0,
    MashVolume:         0,
    FermenterVolume:    0,
    coil : {
        LENGTH:1,
        DIA:0.01,
        SURFACE_AREA:null,
        VOLUME:null,
        temperature:null
    },
    progress: ''
}
simState.coil.SURFACE_AREA = simState.coil.LENGTH * Math.PI * simState.coil.DIA;
simState.coil.VOLUME = simState.coil.SURFACE_AREA * simState.coil.LENGTH;


let toggleInterval = [];
let flowRate = [];
let simInterval = null;

let mashPumpChange              = change(pump.mashPumpName);
let kettlePumpChange            = change(pump.kettlePumpName);
let kettleTempChange            = change(KETTLE_TEMP);
let glycolTempChange            = change("TempGlycol");
let fermenterTempChange         = change("TempFermenter");
let valveMashInChange           = change("valveMashIn");
let valveKettleInChange         = change("valveKettleIn");
let powerChange                 = change("power");
let kettleVolumeChange          = change("KettleVolume");
let mashVolumeChange            = change("MashVolume");
let progressChange              = change("progress");

let coolingTimer = null;

let publishWeight = broker.create("Kg");

function change(item){
    return value => {
        if (simState[item] !== value.value){
            console.log("Sim change",item, simState[item], value.value);
            simState[item] = value.value;

            simStateChange();
        }
    };
}

function simFlowRate(id, mLPerSec){
    if (mLPerSec === flowRate[id]){
        return;
    }
    flowRate[id] = mLPerSec;

    if (toggleInterval[id]){
        clearInterval(toggleInterval[id]);
        toggleInterval[id] = null;
    }
    
    if (mLPerSec !== 0){
        toggleInterval[id] = flow.simToggleInterval(id, mLPerSec, _opt);
    }
}

let simPowerTime = null;
let prevsimPowerTime = null;

const hrsecs = hrtime => hrtime[0] + hrtime[1] / 1E9;

function simPowerChange(){
    const C = 4200;
    let ds;
    if (simPowerTime === null){
        simPowerTime = process.hrtime(); 
        prevsimPowerTime = simPowerTime;
        return;
    }else{
        simPowerTime = process.hrtime();
        ds = hrsecs(simPowerTime) - hrsecs(prevsimPowerTime);
        prevsimPowerTime = simPowerTime;
    }

    let deltaSecs = ds;

    //console.log(`delta sim secs since change of power=${deltaSecs * _opt.sim.speedupFactor}`);

    if (simState.KettleVolume > 0){    
        let dTemp =  (simState.power * deltaSecs * _opt.sim.speedupFactor) / ((simState.KettleVolume) * C);
        if (dTemp > 0){
            let t = dTemp + ds18x20.getByName(KETTLE_TEMP);
            t = (t > 100) ? 100 : t;
            ds18x20.set(KETTLE_TEMP, t);
        }
    }else{
        if ((simState.KettleVolume == 0) && (simState.power > 0)){
            console.log("SIM", "Trying to heat an empty kettle");
        }
    }
}

let heatTransferTime = null;
let prevheatTransferTime = null;

let previousFermenterVolume = 0;
let timeFermentStart = 0;

let mashPumpListener;
let kettlePumpListener;
let kettleTempListener;
let fermenterTempListener;
let powerListener;
let kettleVolumeListener;
let mashVolumeListener;
let progressListener;

/*
called as part of simstatechange
*/
function heatTransferKettleToFermenter(deltaSecs){
    let kettleTemp = ds18x20.getByName(KETTLE_TEMP);
    let fermenterTemp = ds18x20.getByName(FERMENTER_TEMP);

    const COIL_CONDUCTION = 0.001;
    const COIL_VOLUME = 2;

    const heatFlow = COIL_CONDUCTION * COIL_VOLUME * (kettleTemp-fermenterTemp) * deltaSecs * _opt.sim.speedupFactor;
    const deltaFermenterTemp = simState.FermenterVolume ? (heatFlow / (simState.FermenterVolume)) : 0;
    fermenterTemp +=  deltaFermenterTemp

    //fermenter temp needs updated without causing recursion
    //but the fermentation tempcntroller needs it
    //??????
    ds18x20.set(FERMENTER_TEMP, fermenterTemp);
}

function simStateChange(){
    //simPowerChange();
    
    simState.prevPower = simState.power;

    const isPumpKettleOn            = (simState.PumpKettle          === "ON");
    const isPumpMashOn              = (simState.PumpMash            === "ON");
    const isValveKettleInOpen       = (simState.valveKettleIn       === brewdefs.VALVE_STATUS.OPENED);
    const isValveMashInOpen         = (simState.valveMashIn         === brewdefs.VALVE_STATUS.OPENED);
    const isValveFermentTempInOpen  = (simState.valveFermentTempIn  === brewdefs.VALVE_STATUS.OPENED);
    const isValveFermentInOpen      = (simState.valveFermentIn      === brewdefs.VALVE_STATUS.OPENED);
    const isValveChillWortInOpen    = (simState.valveChillWortIn    === brewdefs.VALVE_STATUS.OPENED);
    const isKettleEmpty             = (simState.KettleVolume        <= 0);
    const isMashEmpty               = (simState.MashVolume          <= 0);

    //Kettle Input
    if (isValveKettleInOpen){
        //Kettle In Open
        simFlowRate(flow.ID_FLOW_KETTLE_IN, FLOW_RATE); 
        ds18x20.set(KETTLE_TEMP, 10);
            
    }else{
        //Kettle In Closed
        if (isPumpMashOn){
            if (!isMashEmpty){ 
                simFlowRate(flow.ID_FLOW_KETTLE_IN, FLOW_RATE); 
                simFlowRate(flow.ID_FLOW_MASH_OUT,  FLOW_RATE);
                ds18x20.set("TempMashOut", ds18x20.getByName(MASHTUN_TEMP));
                ds18x20.set(KETTLE_TEMP, ds18x20.getByName(MASHTUN_TEMP));
                if (isPumpKettleOn){ 
                    simFlowRate(flow.ID_FLOW_MASH_IN,    FLOW_RATE);
                    simFlowRate(flow.ID_FLOW_KETTLE_OUT, FLOW_RATE);
                }
            }else{
                simFlowRate(flow.ID_FLOW_KETTLE_IN, 0);
                simFlowRate(flow.ID_FLOW_MASH_OUT, 0);
            }
        }else{
            simFlowRate(flow.ID_FLOW_KETTLE_IN, 0);
            simFlowRate(flow.ID_FLOW_MASHOUT, 0);

            //Ferment Temp Input
            if (isValveFermentTempInOpen && isPumpKettleOn){
                if (!isKettleEmpty){
                    //Ensure kettle volume does not change by not changing flows
                    //simFlowRate(flow.ID_FLOW_KETTLE_OUT, FLOW_RATE);
                    //simFlowRate(flow.ID_FLOW_KETTLE_IN, FLOW_RATE);
                }
                
                if (!prevheatTransferTime){
                    prevheatTransferTime = process.hrtime();
                }else{
                    heatTransferTime = process.hrtime();
                    const  now = hrsecs(heatTransferTime);
                    const then = hrsecs(prevheatTransferTime);
                    const heatTransferSecs =  now - then;
                    prevheatTransferTime = heatTransferTime;
                    heatTransferKettleToFermenter(heatTransferSecs);   
                }
            }else{
                simFlowRate(flow.ID_FLOW_KETTLE_OUT, 0);
            }
        }
    }

    //Mash Input
    if (isValveMashInOpen){
        if (isPumpKettleOn && !isPumpMashOn){
            if (!isKettleEmpty){
                const mashTemp = ds18x20.getByName(MASHTUN_TEMP) + 0.05 * (ds18x20.getByName(KETTLE_TEMP) - ds18x20.getByName(MASHTUN_TEMP));
                ds18x20.set("TempMashIn", mashTemp);
                ds18x20.set(MASHTUN_TEMP, mashTemp);
                simFlowRate(flow.ID_FLOW_KETTLE_OUT, FLOW_RATE);
                simFlowRate(flow.ID_FLOW_MASH_IN,    FLOW_RATE);
            }else{
                simFlowRate(flow.ID_FLOW_KETTLE_OUT, 0);
                simFlowRate(flow.ID_FLOW_MASH_IN,    0);
            }
        }
    }else{
        simFlowRate(flow.ID_FLOW_MASH_IN, 0); 
    }

    
    //Kettle Pumping
    if (isPumpKettleOn) {
        //Pump from Kettle
        ds18x20.set("TempKettleOut", ds18x20.getByName(KETTLE_TEMP));

        if (isValveFermentInOpen && isValveChillWortInOpen){
            ds18x20.set("TempFermentIn", CHILLER_OUTPUT_TEMP);  
            if (!isKettleEmpty){
                simFlowRate(flow.ID_FLOW_KETTLE_OUT, FLOW_RATE);
                simFlowRate(flow.ID_FLOW_FERMENT_IN, FLOW_RATE);
 
                ds18x20.set(FERMENTER_TEMP, CHILLER_OUTPUT_TEMP);
            }else{
                simFlowRate(flow.ID_FLOW_KETTLE_OUT, 0);
                simFlowRate(flow.ID_FLOW_FERMENT_IN, 0);
            }
        }
    }else{
        if (!isPumpMashOn){
            if (isValveMashInOpen){
                ds18x20.set("TempMashIn", ds18x20.getByName(KETTLE_TEMP));
                if (!isKettleEmpty){
                    simFlowRate(flow.ID_FLOW_KETTLE_OUT, 20);
                    simFlowRate(flow.ID_FLOW_MASH_IN, 20);
                }else{
                    simFlowRate(flow.ID_FLOW_KETTLE_OUT, 0);
                    simFlowRate(flow.ID_FLOW_MASH_IN, 0);
                }
            }else{
                simFlowRate(flow.ID_FLOW_KETTLE_OUT, 0);
                simFlowRate(flow.ID_FLOW_MASH_IN, 0);
            }
        }
    }

    //Update weight, assuming SG=1.015
    if (simState.FermenterVolume !== previousFermenterVolume){
        //assumes fermentation starts immediately
        if (timeFermentStart === 0){
            timeFermentStart = hrsecs(process.hrtime());
        }
        previousFermenterVolume = simState.FermenterVolume;
    }

    if (simState.FermenterVolume > 0){
        const fermentTime = hrsecs(process.hrtime()) - timeFermentStart;
        const kGLossPerDay = 10 * _opt.sim.speedupFactor * 1 / 7;
        const kGLossPerSec = kGLossPerDay / (24 * 60 * 60);
        const weight = Math.trunc((simState.FermenterVolume - (fermentTime * kGLossPerSec)) * 10.15)/10;
        publishWeight(weight);
    }

}

module.exports = {
    start(opt) {
        return new Promise((resolve, reject) => {
           _opt = opt;
           //Do nothing if we're not simulating
           if (_opt.sim.simulate === false){
                resolve(_opt);
                return;
           }

            simState.readKettleVolume.then(v => {
                simState.KettleVolume = v;
            }, s => simState.KettleVolume = 0);

            simState.readMashVolume.then(v => {
                simState.mashVolume = v;
            }, s => simState.MashVolume = 0);

            simState.readFermenterVolume.then(v => {
                simState.FermenterVolume = v;
            }, s => simState.FermenterVolume = 0);

            simState.ambientTemp     = _opt.sim.ambientTemp;
            //simState.TempKettle      = _opt.sim.ambientTemp;
            //simState.TempMash        = _opt.sim.ambientTemp;
            simState.TempFermentIn   = _opt.sim.ambientTemp;
            simState.TempFermenter   = _opt.sim.ambientTemp;
            simState.coil.temperature= _opt.sim.ambientTemp;

            mashPumpListener = broker.subscribe(pump.mashPumpName,     mashPumpChange);
            kettlePumpListener = broker.subscribe(pump.kettlePumpName,   kettlePumpChange);
            kettleTempListener = broker.subscribe("TempKettle",          kettleTempChange);
            fermenterTempListener = broker.subscribe("TempFermenter",       fermenterTempChange);
            powerListener = broker.subscribe("power",               powerChange);
            kettleVolumeListener = broker.subscribe("KettleVolume",        kettleVolumeChange);
            mashVolumeListener = broker.subscribe("MashVolume",          mashVolumeChange);
            progressListener = broker.subscribe("progress",      progressChange);
            

            const foo = (valveStatii, name) => valveStatii.find(status => status.name === name);
                
            //            every so often call ...
            simInterval = setInterval(() => {
                const valveStatii = valve.getStatus();
                valveKettleInChange({value:foo(valveStatii, 'ValveKettleIn').state});
                valveMashInChange({value:foo(valveStatii, 'ValveMashIn').state});
             }, 1000);

            const cooling = (factor, sensor) => {
                let temp = ds18x20.getByName(sensor);
                const deltaTemp = _opt.sim.speedupFactor * factor * (temp - _opt.sim.ambientTemp);
                if (deltaTemp > 0){
                    return ((temp - deltaTemp) > _opt.sim.ambientTemp) ? temp - deltaTemp : _opt.sim.ambientTemp;
                }else{
                    return temp;
                }
            };
            
            /**
             * Every simulated minute, reduce temps
             */
            const intervalSecs = 60 / _opt.sim.speedupFactor;
            coolingTimer = setInterval(() => {
                let isKettleEmpty = (simState.KettleVolume <= 0);
                let isMashTunEmpty = (simState.MashVolume <= 0);
                
                const KETTLE_COOLING_FACTOR    = isKettleEmpty  ? 0.0001 : 0.000001;
                const MASH_TUN_COOLING_FACTOR  = isMashTunEmpty ? 0.0001 : 0.00001;
                const FERMENTER_COOLING_FACTOR =                          0.000001;
                
                ds18x20.set(KETTLE_TEMP,  cooling(KETTLE_COOLING_FACTOR,   KETTLE_TEMP));
                ds18x20.set(MASHTUN_TEMP, cooling(MASH_TUN_COOLING_FACTOR, MASHTUN_TEMP));
                
                let isValveFermentTempInOpen  = (simState.valveFermentTempIn === brewdefs.VALVE_STATUS.OPENED);
                let isPumpKettleOn            = (simState.PumpKettle === "ON");
                if (isValveFermentTempInOpen && 
                    isPumpKettleOn && 
                    !isKettleEmpty &&
                    (simState.TempKettle > simState.TempFermenter)){
                        //Fermenter Heating
                        //ds18x20.set(FERMENTER_TEMP, simState.TempFermenter + (FERMENTER_COOLING_FACTOR * (simState.TempKettle - simState.TempFermenter)));
                }else{
                    ds18x20.set(FERMENTER_TEMP, cooling(FERMENTER_COOLING_FACTOR, FERMENTER_TEMP));
                }

                //Also update boil evaporation volume
                if (ds18x20.getByName(KETTLE_TEMP) > 90) {
                    kettle.updateVolume(-(brewdefs.EVAP_RATE_L_PER_HOUR / (60 * 60)) * intervalSecs);
                }        
            }, intervalSecs * 1000);
           
            //Get volumes
            kettle.getStatus();
            mashTun.getStatus();
            
            return temp.getStatus(true).then(() => resolve(opt));
            
        });
    },

    stop() {
        return new Promise((resolve, reject) => {

            broker.unSubscribe(mashPumpListener);
            broker.unSubscribe(kettlePumpListener);
            broker.unSubscribe(kettleTempListener);
            broker.unSubscribe(fermenterTempListener);
            broker.unSubscribe(powerListener);
            broker.unSubscribe(kettleVolumeListener);
            broker.unSubscribe(mashVolumeListener);
            broker.unSubscribe(progressListener);
           
            clearInterval(coolingTimer);
            coolingTimer = null;

            clearInterval(simInterval);
            simInterval = null;

            brewlog.info("sim.js", "stopped");

            resolve();
        });

    }
}