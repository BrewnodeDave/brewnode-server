/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const valves 	= require('./valve.js'); 

let options = {sim:{simulate:false},valveSwitchDelay:10000}

valves.start(options)
.then(valves.selfTest)
.then(console.log)
.catch(console.log);

