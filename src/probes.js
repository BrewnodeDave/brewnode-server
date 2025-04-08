/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

function round(num) {
	return Math.round(num * 10) / 10;
}
/** 
 @const
 @desc Definitions for all temperature probes.
 @property {string} name - Unique pump name.
 @property {string} id - Unique device ID.
 @property {number} prevValue - Previous measurement.
 @property {function} publishTemp - Subscription callback.
 */
 module.exports = [
	{name:'TempKettle',			id:'28-00000751bbce', prevValue:null, publishTemp:null, compensate:x=>round(x*1.023534722-1.509305021)},
	{name:'TempFermenter',  	id:'28-ab0e2e346461', prevValue:null, publishTemp:null, compensate:x=>round(x*1.028165066-2.329363108)},
	//{name:'TempFermenter',  	id:'28-000007519802', prevValue:null, publishTemp:null, compensate:x=>round(x},
	{name:'TempMash',			id:'28-0000069be682', prevValue:null, publishTemp:null, compensate:x=>round(x*1.018340748-1.309362047)},
	{name:'TempGlycol',			id:'28-0000071f5017', prevValue:null, publishTemp:null, compensate:x=>round(x*1.020492493-1.323124509)},	
	{name:'TempAmbient',		id:'28-0000006a79e8', prevValue:null, publishTemp:null, compensate:x=>round(x*1.018340748-1.309362047)},	
	 
	// {name:'TempMashOut',	id:'28-000006613048', prevValue:null, publishTemp:null},
	// {name:'TempKettleIn',	id:'28-03157185e4ff', prevValue:null, publishTemp:null},
	// {name:'TempMashIn',		id:'28-0000065f92d3', prevValue:null, publishTemp:null},
	// {name:'TempFermentIn',	id:'28-0000066188c5', prevValue:null, publishTemp:null},
	// {name:'TempKettleOut',	id:'28-00000673eb45', prevValue:null, publishTemp:null},
];

