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
	{name:"Temp Kettle",	id:'28-00000751bbce', prevValue:null, publishTemp:()=>false, compensate:x=>round(x*1.023534722-1.509305021)},
	{name:"Temp Fermenter",	id:'28-0000071f5017', prevValue:null, publishTemp:()=>false, compensate:x=>round(x*1.020492493-1.323124509)},	
	{name:"Temp Mash",		id:'28-0000069be682', prevValue:null, publishTemp:()=>false, compensate:x=>round(x*1.018340748-1.309362047)},
	{name:"Temp Glycol", id:'28-ab0e2e346461', prevValue:null, publishTemp:()=>false, compensate:x=>round(x*1.028165066-2.329363108)},
	{name:"Temp Ambient",	id:'28-0000006a79e8', prevValue:null, publishTemp:()=>false, compensate:x=>round(x*1.018340748-1.309362047)},	
];

