/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Vessel Module.
 * @module vessel
 * @author Dave Leitch
 * @requires brewdefs
 * @requires temp
 * @requires flow
 * @requires events
 * @requires events
 * @desc A Vessel has flow values on the input and output. It also has
 * an temperatur probe.
 */
const broker = require('../broker.js');
const flow = require('./flow-service.js');

const fs = require('fs');
const path = require('path');

/**
 * Vessel options
 * @typedef {Object} vesselOptions
 * @property {string} name Vessel name
 * @property {string} tempName Temperature sensor name
 * @property {string} flowInName Input Flow sensor name
 * @property {string} flowOutName Output Flow Sensor name
 * @property {number} inletVolume Volume of pipe on inlet
 * @property {number} outletVolume Volume of pipe on output
 */


/**
 * @class Vessel
 * @classdesc A vessel can ... It emits an event ... 
 * @param opt - Pump name and I2C pin number.
 */
function Vessel(opt){
  	const thisVessel = this;    
  	this.name 			= opt.name;
	this.tempName 		= opt.tempName;
	this.flowInName 	= opt.flowInName;
	this.flowOutName	= opt.flowOutName;
	this.inletVolume 	= opt.inletVolume;
	this.outletVolume	= opt.outletVolume;
	this.currentVolume  = 0;//null;
    this.currentTemp    = null;	
	this.filename = path.join(__dirname,`./${this.name}-vol.txt`);
    this.publishVolume  = null;
    // this.saveTimer      = null;
    this.flowInListener = null;
    this.flowOutListener = null;

	//Dont update volume until this threshold has been crossed.
	/** This represents fluid in the pipework between the flow sensors and the vessel.*/
	this.offsetVolume = this.inletVolume + this.outletVolume;
    
    //flow values are in mL. Vessel volume is L.
	this.flowInHandler = ({value}) => {
		thisVessel.updateVolume(value.delta/1000);
	}
	
	this.flowOutHandler = ({value}) => {
		thisVessel.updateVolume(-value.delta/1000);
	}

    /**
     * Load volume from disk and publish result. 
     * @param {*} opt 
     */
	this.load = (opt) => new Promise((resolve, reject) => {	
        resolve(opt);
        return;
        fs.readFile(thisVessel.filename, "utf8", (err, res) => {
            if (!err){
                if (res) {
                    let vol = parseInt(res, 10);
                    if (isNaN(vol)){
                        thisVessel.currentVolume = 0;
                        fs.writeFileSync(thisVessel.filename, thisVessel.currentVolume.toString());
                    }else{
                        thisVessel.currentVolume = vol;
                    }
                } else {
                    thisVessel.currentVolume = 0;
                }
                //Send value from disk to all listeners
                if (thisVessel.publishVolume){
 //                   thisVessel.publishVolume(thisVessel.currentVolume);
                }
                resolve(opt);
            }else{
                thisVessel.currentVolume = 0;
                fs.writeFileSync(thisVessel.filename, thisVessel.currentVolume.toString());
                resolve();
            }
        });
    })
	
	/**
     * Save current volumne to disk. 
     */
	this.save = () => {
		// fs.writeFileSync(thisVessel.filename, thisVessel.currentVolume.toString());
	}
         
    /** 
     * Publish volume. 
     */
	this.getStatus = () => {	
		if (thisVessel.publishVolume){				
			thisVessel.publishVolume(thisVessel.currentVolume);
		}
	};
    
    /** 
     * Reset the volume to zero. Save result to disk and publish.
     */
	this.empty = () => new Promise((resolve, reject) => {		
        thisVessel.load().then(() => {
            thisVessel.currentVolume = 0;
            if (thisVessel.publishVolume){
                thisVessel.publishVolume(thisVessel.currentVolume);
            }
            thisVessel.save();
            resolve();
        });
    });
	
	/** 
 	* Update current volume with delta.
 	* Emit event
     * Possibly save the current volume to disk.
     * @param {number} flowDelta Litres
 	*/
	this.updateVolume = flowDelta => {
//console.log(`vessel.updateVolume = ${flowDelta}`);
if (isNaN(flowDelta)){
    let a=1;
}
        thisVessel.currentVolume = Math.trunc((thisVessel.currentVolume + flowDelta) * 100)/100;
        if (thisVessel.currentVolume < 0){
            thisVessel.currentVolume = 0;
        }
        
		if (thisVessel.publishVolume){
			thisVessel.publishVolume(thisVessel.currentVolume);
			thisVessel.save();
		}
	};
	
	/**
	 * @desc Listen to flow sensors.
	 */
	this.start = (opt) => new Promise((resolve, reject) => {		
        thisVessel.publishVolume = broker.create(`${thisVessel.name}Volume`);
            
        //Listen to flows in order to update volume
        // thisVessel.flowInListener = broker.subscribe(thisVessel.flowInName, thisVessel.flowInHandler);
        // if (thisVessel.flowOutName) {
        //     thisVessel.flowOutListener = broker.subscribe(thisVessel.flowOutName,thisVessel.flowOutHandler);
        // }
        
        thisVessel.load(opt)
        .then(flow.start)
        .then((opt) => {
            //Save volume to disk every second
            //thisVessel.saveTimer = setInterval(thisVessel.save, 1000);
            resolve(opt);
        });
    }),
	
	/**
	 * @desc Remove all listeners
	 */
	this.stop = () => new Promise((resolve, reject) => {
        // clearInterval(thisVessel.saveTimer);
        // thisVessel.saveTimer = null;	
        brewlog.info("vessel-service", "Stop");


        broker.destroy(`${thisVessel.name}Volume`);

        broker.destroy(thisVessel.flowInName)        
        broker.unSubscribe(thisVessel.flowInHandler);

        if (thisVessel.flowOutName) {
            broker.destroy(thisVessel.flowOutName)
            broker.unSubscribe(thisVessel.flowOutHandler);		
        }
        
        flow.stop()
        .then(() => {
            resolve();
        }, reason => {
            console.log("vessel.stop rejected", reason)
        })
        .catch(err => {
            console.log("vessel.stop:",err);
        });
    });	
}//Vessel

module.exports = Vessel;
