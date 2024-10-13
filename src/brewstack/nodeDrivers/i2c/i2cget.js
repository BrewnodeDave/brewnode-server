//Usage: i2cget I2CBUS CHIP-ADDRESS DATA-ADDRESS

const raspi = require('raspi');
const I2C = require('raspi-i2c').I2C;
const i2c = new I2C();
raspi.init(() => console.log("init"));

const i2cbus = parseInt(process.argv[2]);
const chipAddress = parseInt(process.argv[3]);
const dataAddress = parseInt(process.argv[4]);

if (process.argv.length !== 5) {
  console.log("Usage: i2cget I2CBUS CHIP-ADDRESS DATA-ADDRESS");
  process.exit();
}
raspi.init(z => {
    console.log({i2cbus}, {chipAddress},{dataAddress});
    const byte = i2c.readByteSync(chipAddress, dataAddress);
    console.log(`0x${byte.toString(16)}`);
});
