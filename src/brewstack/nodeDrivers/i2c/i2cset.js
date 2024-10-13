//Usage: i2cset I2CBUS CHIP-ADDRESS DATA-ADDRESS [VALUE] [MODE]

const raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;

const i2cbus = parseInt(process.argv[2]);
const chipAddress = parseInt(process.argv[3]);
const dataAddress = parseInt(process.argv[4]);
const value = parseInt(process.argv[5]);

if (process.argv.length !== 6) {
  console.log("Usage: i2cset I2CBUS CHIP-ADDRESS DATA-ADDRESS VALUE");
  process.exit();
}

raspi.init(z => {
  const i2c = new I2C();

  console.log({i2cbus}, {chipAddress},{dataAddress});

  //Initialise all as inputs 
  //i2c.writeByteSync(chipAddress, 0x0, 0);
  //i2c.writeByteSync(chipAddress, 0x1, 0);


  //set this byte as an input before reading
  i2c.writeByteSync(chipAddress, 0x0, 0);
  i2c.writeByteSync(chipAddress, 0x1, 0);
  const before = i2c.readByteSync(chipAddress, dataAddress, value);

  //set this byte as an output before writing
  i2c.writeByteSync(chipAddress, 0x0, 1);
  i2c.writeByteSync(chipAddress, 0x1, 1);
  i2c.writeByteSync(chipAddress, dataAddress, value);

  //set this byte as an input before reading
  i2c.writeByteSync(chipAddress, 0x0, 0);
  i2c.writeByteSync(chipAddress, 0x1, 0);
  const after = i2c.readByteSync(chipAddress, dataAddress, value);

  console.log({before}, {after});
});

