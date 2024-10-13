/**
 * Kettle Module.
 * @module kettle
 * @desc Kettle is an instance of a Vessel aggregrated with a heater and temperature sensor
 */

const brewlog = require('../../../common/brewlog.js');
const heater = require('../heater/heater.js');
const Vessel = require('../vessel.js');
const options = {
    name:        'Kettle',
  	tempName:    'TempKettle',
	// flowInName:  'FlowKettleIn',
	flowOutName: 'FlowKettleOut',
    inletVolume: 0,//sub from vol
	outletVolume:0//sub from vol
};

///var kettleVessel = {vessel: new Vessel(options)}//new Vessel(options);

//Heater is switched off when the kettle volume is less than MIN_VOLUME
const MIN_VOLUME = 10000;

/**
Here is the formula for evaporation losses

kW = 3067 x (Hsat - Hamb)

with:
Hsat: specific humidity of saturated air at the temperature of the water (g water / kg air)
Hamb: specific humidity of ambient air at the temperature of the water (g water / kg air)
*/
function evaporation(vol){
	const newVol = vol;
	return newVol;
}

function volumeHandler(value){
	if (value <= MIN_VOLUME){
		if (heater.getPower() !== 0){
			//brewlog.info("Minimum volume in kettle.", value);
			//heater.setPower(0);
		}
	}
}

let vessel;

module.exports = {
	getEnergy: heater.getEnergy,
	getStatus: () => { return vessel.getStatus()},

	start(opt) {
		return new Promise((resolve, reject) => {	
			vessel = new Vessel(options);
			vessel.start(opt)
			.then(heater.start)
			.then(() => {	
				resolve(opt);
			},(reason) => {	
				brewlog.critical(`Kettle failed to start:${reason}`);
				reject(reason);
			})
			.catch(err => {
				brewlog.error(err);
			});
		});
	},
	
	setPower(watts) {
		heater.setPower(watts);
	},
	
	MAX_W: heater.MAX_W,
	
	KETTLE_TEMPNAME: options.tempName,
	
	stop() {
		return new Promise((resolve, reject) => {	
			heater.stop()
			.then(vessel.stop)
			.then((r) => {
				vessel = null;
				brewlog.info("kettle.js", "stopped");

				resolve(r);
			});
		});
	},
	
	empty: () => vessel.empty(),

	updateVolume: (flowDelta) => vessel.updateVolume(flowDelta)
}
