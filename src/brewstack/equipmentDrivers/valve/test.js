const startStop = require('../../../common/start-stop.js');

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
