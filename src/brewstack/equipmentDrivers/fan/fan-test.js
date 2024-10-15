/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

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
