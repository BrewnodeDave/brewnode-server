/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const fs = require('fs');
const brewdefs= require('./brewdefs.js');
const brewlog = require('./brewlog.js');
const brewfather = require('../../services/brewfather-service.js');
const temp = require('../../services/temp-service.js');

const FLOW_TIMEOUT_SECS = 2;
/**
 * Json Brew data
 * @desc JSON representation of a brew
 * @typedef {Object} jsonData
 * @property {string} brewname         	- Name to use in logs
 * @property {number} bottleLitres     	- Final botttling volume
 * @property {number} grainTempC  
 * @property {number} grainKg
 * @property {number} mashTempC
 * @property {string} sparge			- "batch" or "none"
 * @property {number} spargeTempC  		- Sparge water temperature.
 * @property {number} mashMins          - Duration of the mash
 * @property {number} boilMins          - Duration of the boil
 * @property {number} fermentTempC      - Temperature to maintain during fermentation
 * @property {number} fermentDays       - Duration of the fermentation
 */

const simOptions = {
	simulate		:!brewdefs.isRaspPi(),
	ambientTemp		:10,
	speedupFactor	:10,
	resetLog		:true //Clear out logs before starting
}

/**
* @desc Calculate the strike volume for a single infusion mash.
* @param {number} grainMass - Dry grain mass in Kg.
* @returns {number}  - Strike litres
*/
const strikeVolume = grainMass => grainMass * brewdefs.WATER_TO_GRIST + brewdefs.MASHTUN_LOSSES

/**
* @desc Calculate the strike temperature.
* @param {number} gristTemp - Dry grain temperature.
* @param {number} mashTemp - Desired mash temperature.
* @param {number} strikeVolume - Volume of water.
* @param {number} mashVolume - grainMass.
* @returns {number} strikeTemp
*/
const strikeTemp = (gristTemp, mashTemp, strikeVolume, mashVolume) => {
    const grainHeatCapacity = 0.4;
    const R = (strikeVolume/mashVolume); //weight of water to grist
	const pipeOutTemp = mashTemp + ((grainHeatCapacity/R) * (mashTemp - gristTemp));

	const stainlessSteelHeatCapacity = .502;
	const pipeMass = 1;
	const pipeTemp = gristTemp;
	const strike = pipeOutTemp + (pipeMass * stainlessSteelHeatCapacity * (pipeOutTemp - pipeTemp));
	return strike;

}

const BREW_ROOT = "./brews/";

/**
 * @param {string} filename
 * @param {any} speedupFactor
 */
function readBrewfatherJSONSync(filename, speedupFactor){
	const jsonFilename = `${BREW_ROOT + filename}/${filename}.json`;
	const brewfather = JSON.parse(fs.readFileSync(jsonFilename).toString());

	let recipe;``
	if (brewfather._type === 'batch'){
		recipe = brewfather.recipe;
	} else if (brewfather._type === 'recipe'){
		recipe = brewfather;
	}else{
		console.error("Unknown file type=",brewfather._type)
		console.assert(false);
	}
	
	return recipe2Options(recipe, filename, speedupFactor);
}

/**
 * @param {number} speedupFactor
 */
async function getBrewfatherOptions(speedupFactor){
	console.log("readBrewfatherJSON");z
	const recipe = await brewfather.currentRecipe();
	const filename = recipe.name;
	const options = recipe2Options(recipe, filename, speedupFactor);
	return options;
}
	
/**
 * @param {{ name: any; data: { mashWaterAmount: any; strikeTemp: any; spargeWaterAmount: number; hltWaterAmount: any; }; mash: { steps: { tempC: number; mins:number}[]; }; boilTime: any; fermentation: { steps: { mins: any; tempC: number }[]; }; equipment: { whirlpoolTime: any; }; }} recipe
 * @param {any} filename
 * @param {number} speedupFactor
 */
function recipe2Options(recipe, filename, speedupFactor){
	simOptions.speedupFactor = speedupFactor;

	let options = {
		filename,
		brewname: 		recipe.name,
		strikeLitres:	recipe.data.mashWaterAmount,
		strikeTemp:		recipe.data.strikeTemp,
		sparge:			recipe.data.spargeWaterAmount > 0,
		spargeLitres:   recipe.data.hltWaterAmount,
		spargeTemp: 	recipe.data.strikeTemp,
		mashMins: 		recipe.mash.steps.reduce((/** @type {any} */ prev, {mins}) => prev + mins,0),
		boilMins: 		recipe.boilTime,
		fermentTempC: 	recipe.fermentation.steps[0].tempC,
		fermentDays:	recipe.fermentation.steps[0].mins,
		fermentSteps:	recipe.fermentation.steps,
		mashSteps:		recipe.mash.steps.map(({mins, tempC}) => ({
            mins:mins,
            temp:tempC
        })),
		flowTimeoutSecs:FLOW_TIMEOUT_SECS,
		flowReportSecs:	1,
		whirlpoolMins:	recipe.equipment.whirlpoolTime,
		valveSwitchDelay: 5000,
		numBrews:1
	};
	options.sim = simOptions;


	if (simOptions.simulate){
		options.boilMins 		= options.boilMins / simOptions.speedupFactor;
		options.mashMins 		= options.mashMins / simOptions.speedupFactor;
		options.whirlpoolMins 	= options.whirlpoolMins / simOptions.speedupFactor;
		options.fermentDays 	= options.fermentDays / simOptions.speedupFactor;
		options.flowTimeoutSecs	= options.flowTimeoutSecs / simOptions.speedupFactor;
		options.flowReportSecs	= options.flowReportSecs / simOptions.speedupFactor;
		options.valveSwitchDelay = options.valveSwitchDelay / simOptions.speedupFactor;
		options.mashSteps		= options.mashSteps.map((/** @type {{ mins: number; temp: any; }} */ step) => ({mins:step.mins / simOptions.speedupFactor ,temp:step.temp}));
	}

	options.mashTempC = recipe.mash.steps[0].tempC;

	return options;
}

module.exports = {
	/**
	 * @param {any} speedupFactor
	 */
	async brewfatherOptions(speedupFactor) {
		const options = await getBrewfatherOptions(speedupFactor);
		await temp.start(options);
		return options;
    },

    readJSON(filename, speedupFactor) {
		let options = readBrewfatherJSONSync(filename, speedupFactor);
		brewlog.startSync(options);
			
		return new Promise((resolve, reject) => {
			temp.start(brewlog.startSync(options))
			.then(() => {
				resolve(options);
			});
		});
    },

	//These are used only when there is no brew data from json or xml files.
	defaultOptions() {	
		let options = {
			ambientTemp:		10,
			flowTimeoutSecs:	FLOW_TIMEOUT_SECS,
			flowReportSecs:		1,
			whirlpoolMins:		5,
			boilMins: 			90,
			valveSwitchDelay: 	5000,
			sparge:				'batch',
			spargeLitres:		20
		}
		simOptions.speedupFactor = 10;
		
		options.sim = simOptions;

		if (simOptions.simulate){
			options.flowTimeoutSecs		= options.flowTimeoutSecs 	/ simOptions.speedupFactor;
			options.boilMins			= options.boilMins 			/ simOptions.speedupFactor;
			options.whirlpoolMins		= options.whirlpoolMins 	/ simOptions.speedupFactor;
			options.valveSwitchDelay	= options.valveSwitchDelay 	/ simOptions.speedupFactor;
			options.mashMins 			= options.mashMins 			/ simOptions.speedupFactor;
			options.fermentDays 		= options.fermentDays 		/ simOptions.speedupFactor;
		}

		return options;
	}
}
