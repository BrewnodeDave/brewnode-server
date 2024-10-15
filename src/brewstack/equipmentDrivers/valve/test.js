/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const startStop = require('../../../start-stop.js');

const opt = {
    brewname: "test"
}

const valve = require('./valve.js');
if (process.argv.length !== 4){
       console.log(valve.names);
       console.log ("test.js 1(open)/0(close) name\n")
}else{
    startStop.start(opt)
    .then(()=>{
        const valveName = process.argv[3];
        if (process.argv[2] == '1'){
            valve.open(valveName);
        }else{
            valve.close(valveName);
        }
    })
    .then(startStop.stop);
}
