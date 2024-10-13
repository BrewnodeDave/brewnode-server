/**
 * MashTun Module.
 * @module mashtun
 * @author Dave Leitch
 * @requires vessel
 * @requires brewlog
 * @desc The Mashtun is a simple paramterized instance of a vessel.
 */

const brewlog = require('../../../common/brewlog.js');
const Vessel = require('../vessel.js');

const MASHTUN_TEMPNAME = 'TempMash';

const options = {
    name:        'Mash',
    tempName:    MASHTUN_TEMPNAME,
    flowInName:  'FlowKettleOut',
    flowOutName: 'FlowMashOut',
    inletVolume: 0,//add to vol
    outletVolume:0//sub from vol
};

let vessel;

module.exports = {
	getStatus: () => { return vessel.getStatus()},
	MASHTUN_TEMPNAME,	
	start(opt) {
		vessel = new Vessel(options);
		let start = vessel.start;
		return new Promise((resolve, reject) => {		
			start(opt)
			.then((opt) => {	
				resolve(opt);
			},(reason) => {	
				reject(reason);
			})
			.catch(err => {
				brewlog.error(err);
			});
		})
		.catch(err => {brewlog.error(err)});
	},
	
	stop() {
		return new Promise((resolve, reject) => {		
			vessel.stop()
			.then(() => {
				vessel = null;
				brewlog.info("mashtun.js", "stopped");

				resolve();
			},
			(reason) => {	
				brewlog.critical("Mashtun failed to stop");
				reject(reason);
			})
			.catch(err => {
				console.log(err);
			});
		});
	},
	
	empty: () => vessel.empty()
}
