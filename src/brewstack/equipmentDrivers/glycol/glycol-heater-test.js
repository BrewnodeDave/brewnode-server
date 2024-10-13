const glycolHeater = require('./glycol-heater.js');
//const i2c = require('../../nodeDrivers/i2c/i2c_mraa.js');
const i2c = require('../../nodeDrivers/i2c/i2c_raspi.js');

console.log(i2c);
const opt = {sim:{simulate:false}};

i2c.start(opt);

glycolHeater.start(opt).then(()=>{
    console.log("started");
    glycolHeater.switchOn();
    console.assert(glycolHeater.isOn(), true);
    setTimeout(()=>{
        glycolHeater.switchOff();
        console.assert(glycolHeater.isOn(), false);
    }, 5000);
})
