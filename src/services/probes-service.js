/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/** 
 @const
 @desc Definitions for all temperature probes.
 @property {string} name - Unique pump name.
 @property {string} id - Unique device ID.
 @property {number} prevValue - Previous measurement.
 @property {function} publishTemp - Subscription callback.
 */
 module.exports = [
	{name:'TempKettle',		id:'28-00000751bbce', prevValue:null, publishTemp:null},
	{name:'TempFermenter',  id:'28-000007519802', prevValue:null, publishTemp:null},
	{name:'TempGlycol',		id:'28-0000071f5017', prevValue:null, publishTemp:null},	
	{name:'TempMash',		id:'28-0000069be682', prevValue:null, publishTemp:null},

	// {name:'TempAmbient',	id:'28-00000???????', prevValue:null, publishTemp:null},	
	
	// {name:'TempMashOut',	id:'28-000006613048', prevValue:null, publishTemp:null},
	// {name:'TempKettleIn',	id:'28-03157185e4ff', prevValue:null, publishTemp:null},
	// {name:'TempMashIn',		id:'28-0000065f92d3', prevValue:null, publishTemp:null},
	// {name:'TempFermentIn',	id:'28-0000066188c5', prevValue:null, publishTemp:null},
	// {name:'TempKettleOut',	id:'28-00000673eb45', prevValue:null, publishTemp:null},
];

