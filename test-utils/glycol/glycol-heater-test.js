/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


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
