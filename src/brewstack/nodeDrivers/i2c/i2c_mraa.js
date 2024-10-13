/**
 * I2C Driver.
 * @module i2c
 * @author Dave Leitch
 * @requires brewlog
 * @requires node-mcp23017
 * @requires child_process
 * @desc This module provides access to all I2C GPIO expansion pins via a 32 bit bus.
 * The expansion module has 2 ports and each port has 2 banks which are 8 bits wide. 
 * These are mapped onto a single 32 bit value that can be read and written.
 * http://ww1.microchip.com/downloads/en/DeviceDoc/21952b.pdf

Usage: i2cset [-f] [-y] [-m MASK] [-r] I2CBUS CHIP-ADDRESS DATA-ADDRESS [VALUE] ... [MODE]
  I2CBUS is an integer or an I2C bus name
  ADDRESS is an integer (0x03 - 0x77)
  MODE is one of:
    c (byte, no value)
    b (byte data, default)
    w (word data)
    i (I2C block data)
    s (SMBus block data)

E.g. Switch on watchdog led  =>  
	DIR:0=out: 
	i2cset -y 1 0x21 0x0  0xBF
	i2cset -y 1 0x21 0x12 0x40
     Close Valve 0
	DIR:0=out:
        i2cset -y 1 0x20 0x1  0xFE
	i2cset -y 1 0x20 0x13 0x1
     Switch On Heater
	DIR:0=out:
	i2cset -y 1 0x21 0x0 0xFD   
        i2cset -y 1 0x21 0x12 0x2	

        	chip    data    value   pin
Flow 7		0x21	0x13	0x80	31	In
Flow 6		0x21	0x13	0x40	30	In	
Flow 5		0x21	0x13	0x20	29	In	
Flow 4		0x21	0x13	0x10	28	In	
Flow 3		0x21	0x13	0x8	27	In	
Heater(was Flow 2)0x21	0x13	0x4	26	In
Flow 1		0x21	0x13	0x2	25	In
Flow 0		0x21	0x13	0x1	24	In	

                chip    data    value   pin
Watchdog Halt	0x21	0x12	0x80	23	In	
Watchdog LED	0x21	0x12	0x40	22	Out	1 = On
//Heater	0x21	0x12	0x20	21	Out	1 = On
//Heater	0x21	0x12	0x10	16	Out	1 = On
//Heater        0x21	0x12	0x02	17	Out	1 = On

Relay ?	   	0x20	0x13	0x80	15	Out	
Relay ?		0x20	0x13	0x40	14	Out	
Relay ?		0x20	0x13	0x20	13	Out	
Pump 0		0x20	0x13	0x10	12	Out	0 = On
Valve 6		0x20	0x13	0x8	11	Out	0 = Open 
Valve 4		0x20	0x13	0x4	10	Out	0 = Open 
Valve 2		0x20	0x13	0x2	9	Out	0 = Open 
valve 0		0x20	0x13	0x1	8	Out	0 = Open 

Valve 1		0x20	0x12	0x80	7	Out	0 = Open 
Valve 3		0x20	0x12	0x40	6	Out	0 = Open
Valve 5		0x20	0x12	0x20	5	Out	0 = Open 
Valve 7		0x20	0x12	0x10	4	Out	0 = Open
Pump 1		0x20	0x12	0x8	3	Out	
Relay ?		0x20	0x12	0x4	2	Out	
Relay ?		0x20	0x12	0x2	1	Out	
Relay ?		0x20	0x12	0x1	0	Out	
 */

const brewlog = require('../../../common/brewlog.js');
const brewdefs = require('../../../common/brewdefs.js');
let mraa;
let i2c;

let dataDir  = [0xFF, 0xFF, 0xFF, 0xFF];
let dataByte = [0x00, 0x00, 0x00, 0x00];

/**
 * Write a bit into the register
 | @param {Number} bankAddr 
 * @param {Number} data 
 * @param {Number} bit 
 * @param {Number} value 
 */	
function writeReg(bankAddr, data, bit, value){
	brewlog.debug("writeReg", `0x${bankAddr.toString(16)}, 0x${data.toString(16)}, ${bit}, ${value}`);
	
	const mask = 1 << bit;
	let result;
	if (value == 1){
		result = (data | mask);
	}else if (value == 0){
		result = (data & ~mask);
	}else{
		brewlog.critical("writeReg", `${value}`)	
	}
	i2c.writeReg(bankAddr, result);
	//console.log("[0x"+bankAddr.toString(16),"]<=0x"+result.toString(16))
	return result;
}

/**
 * 
 * @param {Number} byte 
 * @param {Number} bit 
 */
function getBit(byte, bit){
	const result = (byte & (1 << bit)) >> bit;
	//console.log("bit",bit,"of",byte,"=",result)
	return result; 
}

module.exports = { 
	start({sim}) {
		if (sim.simulate){
			// @ts-ignore
			mraa = require('../../../sim/mraa.js');
		}else{
			// @ts-ignore
			mraa = require('mraa');
		}
		i2c = new mraa.I2c(0);

		//Initialise all as inputs 
		i2c.address(0x20);
		i2c.writeReg(0x0, dataDir[0]);
		i2c.writeReg(0x1, dataDir[1]);
		i2c.address(0x21);
		i2c.writeReg(0x0, dataDir[2]);
		i2c.writeReg(0x1, dataDir[3]);

		module.exports.DIR_INPUT =  mraa.DIR_IN;
		module.exports.DIR_OUTPUT = mraa.DIR_OUT;
		module.exports.Gpio = mraa.Gpio;

		//console.log("i2c started");
	},
	
	/** Set or clear any bit
	 * @param {number} bit - Bit number [0:31]
	 * @param {number} value - 0 or 1
	 */
    writeBit(bit, value) {
		brewlog.debug("writeBit", `${bit}, ${value}`);
		if (bit < 16){
			i2c.address(0x20);
			if (bit < 8){
				dataByte[0] = writeReg(0x12, dataByte[0], bit, value);	
			}else{		
				dataByte[1] = writeReg(0x13, dataByte[1], bit-8, value);	
			}
		}else{	
			i2c.address(0x21);
			if (bit < 24){
				dataByte[2] = writeReg(0x12, dataByte[2], bit-16, value);		
			}else{		
				dataByte[3] = writeReg(0x13, dataByte[3], bit-24, value);		
			}
		}
	},
	
	/** Read any single bit
	 * @param {number} bit - Bit number [0:31]
	 */
    readBit(bit) {
		let result;
		if (bit < 16){
			i2c.address(0x20);
			if (bit < 8){
				dataByte[0] = i2c.readReg(0x12);
				//console.log("[byte0]=>"+dataByte[0])
				result = getBit(dataByte[0], bit); 
			}else{		
				dataByte[1] = i2c.readReg(0x13);
				//console.log("[byte1]=>"+dataByte[1])
				result = getBit(dataByte[1], bit-8); 
			}
		}else{	
			i2c.address(0x21);
			if (bit < 24){
				dataByte[2] = i2c.readReg(0x12);		
				//console.log("[byte2]=>"+dataByte[2])
				result = getBit(dataByte[2], bit-16); 
			}else{		
				dataByte[3] = i2c.readReg(0x13);		
				//console.log("[byte3]=>"+dataByte[3])
				result = getBit(dataByte[3], bit-24); 
			}
		}

		//console.log("bit[",bit,"]=>"+result)
		
		return result;
	},
	
	/** Toggle any bit
	 * @param {number} n - Bit number [0:31]
	 */
	toggleBit(n) {
		const b = this.readBit(n);
		if (b === 0){
			this.writeBit(n, 1);
		}else{
			this.writeBit(n, 0);
		}
	},
	
	/** Set direction of a single bit
	 * @param {number} bit - Bit number [0:31]
	 * @param {number} value - DIR_INPUT | DIR_OUTPUT
	 */
	setDir(bit, value) {
		brewlog.debug("setDir", `${bit} = ${value}`);

		if (bit < 16){
			i2c.address(0x20);
			if (bit < 8){
				dataDir[0] = writeReg(0x0, dataDir[0], bit, value); 
			}else{		
				dataDir[1] = writeReg(0x1, dataDir[1], bit-8, value); 
			}
		}else {
			i2c.address(0x21);
			if (bit < 24){
				dataDir[2] = writeReg(0x0, dataDir[2], bit-16, value); 
			}else{		
				dataDir[3] = writeReg(0x1, dataDir[3], bit-24, value); 
			}
		}
	},
  
  
    /**
     * @desc Initialise an individual bit.
	 */
    init(bitInfo) {
		//console.log(bitInfo);
		brewlog.debug("init");
		
		this.setDir(bitInfo.number, bitInfo.dir);
		
		if (bitInfo.dir === this.DIR_INPUT){
			this.setDir(bitInfo.number, bitInfo.dir);
		}else 
		if (bitInfo.dir === this.DIR_OUTPUT){
			this.writeBit(bitInfo.number, bitInfo.value);
			this.setDir(bitInfo.number, bitInfo.dir);
		}else{
			brewlog.error("Error initialising i2c", bitInfo);
		}	
	},
	
	getWord() {
		i2c.address(0x20);
		const byte0 = i2c.readReg(0x12);
		const byte1 = i2c.readReg(0x13);
		i2c.address(0x21);
		const byte2 = i2c.readReg(0x12);		
		const byte3 = i2c.readReg(0x13);		
	
		const word = (byte3 << 24) | (byte2 << 16) | (byte1 << 8) | byte0;
	
		return word;
	}
}

