const brewdefs = require('../../../common/brewdefs.js');
const brewlog = require('../../../common/brewlog.js');
const mraa = require('mraa');

function now(){
    const d = new Date();
    return d.getMilliseconds();
}

function measure(){   
    const trig = new mraa.Gpio(20);
    trig.dir(mraa.DIR_OUT);

    const echo = new mraa.Gpio(21);
    echo.dir(mraa.DIR_IN);
  
    trig.write(0);
    console.log("Waiting For Sensor To Settle");
    setTimeout(() => {
        trig.write(1);
        trig.write(0);
        
        while (echo.read()==0);
        const pulse_start = now();
    
        while (echo.read()==1);
        const pulse_end = now();
    
        const pulse_duration = pulse_end - pulse_start;
    
        const distance = pulse_duration * 17150;
    
        console.log("Distance:",distance,"cm");
            
    }, 2000);
		
}