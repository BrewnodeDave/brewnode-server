 /*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Fermenter Module.
 * @module fermenter
 * @desc Fermenter is a Vessel
 */
 
const brewlog = require("../brewstack/common/brewlog.js");
const broker = require("../broker.js");
const Vessel = require('../vessel.js');

const options = {
    name:        'Fermenter',
  	tempName:    'TempFermenter',
	flowInName:  'FlowFermentIn',
	flowOutName: null,
    inletVolume: 0,
	outletVolume:0
};

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
