const i2cService = require('./i2c_raspi-service.js');


// Get the bit number from the command-line arguments
const bitToTest = parseInt(process.argv[2], 10);
const value = parseInt(process.argv[3], 10);

if (isNaN(bitToTest) || bitToTest < 0 || bitToTest >= 32) {
    console.error('Please provide a valid bit number (0-31) as a command-line argument.');
    process.exit(1);
}

test(bitToTest, value);

async function test(bitNumber, value){
   await i2cService.start();

       const intialValue = 0;
       i2cService.init({number: bitNumber, dir:i2cService.DIR_OUTPUT, value:intialValue});
       i2cService.writeBit(bitNumber, value);
        
}
