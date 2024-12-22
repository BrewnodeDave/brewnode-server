const i2cService = require('./i2c_raspi-service');


// Get the bit number from the command-line arguments
const bitToTest = parseInt(process.argv[2], 10);

if (isNaN(bitToTest) || bitToTest < 0 || bitToTest >= 32) {
    console.error('Please provide a valid bit number (0-31) as a command-line argument.');
    process.exit(1);
}

test(bitToTest);

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
