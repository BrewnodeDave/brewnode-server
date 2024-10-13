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

