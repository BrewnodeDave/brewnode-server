/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const pump = require('./pump.js');

const pumps = pump.pumps;

const switched = value => {
	if (value == "on") {
		console.log("pump on");
        setTimeout(() => {
          pumps[0].switchOff();
		}, 1000);		  
	} else {
		console.log("pump off");
	}
};
		
pumps[0].on("pump", switched);
pumps[1].on("pump", switched);

console.log("switching on pump 0");
pumps[0].switchOn();

