/**
 * Fermenter Module.
 * @module fermenter
 * @desc Fermenter is a Vessel
 */
 
const brewlog = require("../../../common/brewlog.js");
const broker = require("../../../common/broker.js");
//const weigh = require('../../equipmentDrivers/weight/weigh.js');
const Vessel = require('../vessel.js');


let gravityPublish;

/**
 * @desc Calculate Specific Gravity.
 * @param {number} Kg - Weight on scales.
 * OG = OriginalMass / Volume
 * FG = FinalMass / Volume
 * ABV = (76.08*(OG-FG)/(1.775-OG)) * (FG/0.794)
 */
function calcSG(Kg) {
	if (gravityPublish){
		if (vessel.currentVolume != 0){	
			//Round to 3 decimal places
			let SG = Math.round(1000 * Kg / (vessel.currentVolume)) / 1000;			
			gravityPublish(SG);
		}
	}else{
		brewlog.error("gravityPublish() has not yet been initialised");
	}
}

const options = {
    name:        'Fermenter',
  	tempName:    'TempFermenter',
	flowInName:  'FlowFermentIn',
	flowOutName: null,
    inletVolume: 0,
	outletVolume:0
};


//on weight change	
/**
 * @desc Calculate Specific Gravity upon a weight change
 * @param {{name:string, date:number, value:number}} data - Data from sensor.
 */
function weightHandler({value}) {
	calcSG(value);	
}

let vessel;

module.exports = {
	getStatus: () => vessel.getStatus(),

	start(opt) {
		return new Promise((resolve, reject) => {	
			vessel = new Vessel(options);
			vessel.start(opt)
			.then((opt) => {	
				resolve(opt);
			},
			(reason) => {	
				brewlog.critical("Fermenter failed to start");
				reject(reason);
			})
			.catch(err => {
				console.log(err);
			});
		});
	},
	
	stop() {
		return new Promise((resolve, reject) => {		
			vessel.stop()
			.then(() => {
				broker.unSubscribe(weightHandler);
				broker.destroy("Gravity");
				vessel = null;
				resolve();
			});
		});
	},

	empty: () => vessel.empty()
}
