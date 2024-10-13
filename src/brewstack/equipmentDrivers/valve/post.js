const valves 	= require('./valve.js'); 

let options = {sim:{simulate:false},valveSwitchDelay:10000}

valves.start(options)
.then(valves.selfTest)
.then(console.log)
.catch(console.log);

