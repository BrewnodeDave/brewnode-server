const fan = require('./fan.js');
const i2c = require('../../nodeDrivers/i2c/i2c_mraa.js');
console.log(i2c);
const opt = {sim:{simulate:false}};

i2c.start(opt);

fan.start(opt).then(()=>{
    console.log("started");
    fan.switchOn();
    console.assert(fan.isOn(), true);
    setTimeout(()=>{
        fan.switchOff();
        console.assert(fan.isOn(), false);
    }, 5000);
})
