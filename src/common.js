const tempController = require('./brewstack/processControl/tempController.js');
const kettle = require('./brewstack/equipmentDrivers/kettle/kettle.js');
const therm = require('./brewstack/nodeDrivers/therm/temp.js');
const k2m = require('./brewstack/brewingAlgorithms/k2m.js');

/**
 * @desc Preheat the kettle to desired temperature.
 * @param {number} t - Desired temp.
 * @param {brewOptions} brewOptions - Description of the current brew.
 */
function heatKettle(t, brewOptions, mins = 0) {
	const desiredTemp = t;
	return new Promise((resolve, reject) => {
		if (brewOptions.sim.simulate) {
			mins = mins / brewOptions.sim.speedupFactor;
		}
		const P = 500;

		tempController.init(kettle.KETTLE_TEMPNAME, P, 0.3, 100, brewOptions)
			.then(function () {
				tempController.setTemp(desiredTemp, mins)
					.then(function () {
						tempController.stop();
						resolve(brewOptions);
					});
			});
	});
}

/**
 * @desc Transfer contents of Kettle to the Mash Tun
 * @param {brewOptions} brewOptions - Description of the current brew.
 */
function kettle2Mash(brewOptions) {
	return k2m.start(brewOptions)
	.then(k2m.transfer)
	.then(k2m.stop);
}

//Temp loss for a fixed flow rate
function pipeHeatLoss(tempFluid, tempSensorName) {
	return new Promise((resolve, reject) => {
		therm.getTemp(tempSensorName)
		.then(tempAmbient => {
			const k = 16;// W/mC the heat transfer coefficient of stainless steel
			const L = 1.76;//0.35;//1.32;//1.76;//the length of pipe
			const innerDiameter = 12.5;//0.022;
			const outerDiameter = 31;//0.027;
			const flowRate = 0.200;

			const C = 4200; //Sepcific heat capacity of water
			const heatLossJPerSec = 2 * Math.PI * k * L * (tempFluid - tempAmbient) / (Math.log(outerDiameter / innerDiameter));

			const k2 = 18 / (60 - 18);
			const empiricalDeltaTemp = k2 * (tempFluid - tempAmbient);

			const deltaTemp = heatLossJPerSec / C / flowRate;
			
			resolve(deltaTemp);
		});
	});
}


module.exports = {
    heatKettle,
    kettle2Mash,
 	pipeHeatLoss
}

