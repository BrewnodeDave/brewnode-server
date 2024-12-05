const i2cService = require('./i2c_raspi-service');

for(let i=0; i<32; i++){
    test(i);
}   

async function test(bitNumber){
    await i2cService.start({sim: true});

    writeRead(1);
    writeRead(0);

    function writeRead(value) {
        const intialValue = 0;
        
        i2cService.init({number: bitNumber, dir:i2cService.DIR_OUTPUT, value:intialValue});
        i2cService.writeBit(bitNumber, value);
        
        i2cService.init({number: bitNumber, dir:i2cService.DIR_INPUT, value:intialValue});
        const result = i2cService.readBit(bitNumber);
        
        if (result !== value) {
            console.error(`Expected ${value}, got ${result}`);
        }else{
            console.log(`Test passed for bit ${bitNumber}`);
        }
    }
}
