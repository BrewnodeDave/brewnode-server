/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

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

BANK0:
	IO_DIR_A @ 0x0
	IO_DIR_B @ 0x1
BANK1:
	IO_DIR_A @ 0x0
	IO_DIR_B @ 0x10


	bit 1 = relay 3
	bit 2 = kettle heater
	bit 3 = mash pump
	bit 4 = fermenter pump
	bit 5 = kettle in valve
	bit 6 = relay 4
	bit 8 = glycol pump
	bit 9 = valve 3 = chill in valve
	bit 10 = valve 5
	bit 11 = mash in valve
	bit 12 = kettle pump
	bit 13 - fan
	bit 14 = relay 4
	bit 15 = relay 2
	bit 22 = watchdog led?
	
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

        	chip    data    bit   pin
	same as defs
Valve Ferment(2)0x20	0x13	7	15	no,4
Hood		0x20	0x13	6	14	no,13
Pump?		0x20	0x13 	5	13	no,12
Valve MashIn(7)	0x20 	0x13 	3	11	yes
Relay 5		0x20	0x13 	2	10
Valve ChillIn(3)0x20 	0x13 	1	9	yes
Chill Pump	0x20	0x13 	0	8	yes	

Relay 4		0x20	0x12	6	6`
Valve Kettle In	0x20	0x12	5	5	yes
Relay 8		0x20	0x12	4	4`
Pump1?		0x20	0x12 	3	3	yes
Heater		0x20	0x12	2	2	yes	


Flow 3		0x21	0x13	0x8	27	In	
Flow 1		0x21	0x13	0x2	25	In
Flow 0		0x21	0x13	0x1	24	In	
Watchdog Halt	0x21	0x12	0x80	23	In(1)	
Watchdog LED	0x21	0x12	0x40	22	Out(0)	1 = On
 */

const brewlog = require('../brewstack/common/brewlog.js');
const brewdefs = require('../brewstack/common/brewdefs.js');
let mraa;
let _i2c;

const REG20 = 0x20;
const REG21 = 0x21;

const DIR_INPUT =  1;
const DIR_OUTPUT = 0;

const BYTE_INPUT = (DIR_INPUT << 0) | (DIR_INPUT << 1) | (DIR_INPUT << 2) | (DIR_INPUT << 3) | (DIR_INPUT << 4) | (DIR_INPUT << 5) | (DIR_INPUT << 6) | (DIR_INPUT << 7);

/**
 * Raspi I2C is part of the Raspi.js suite that provides access to the hardware I2C 
 * on pins 3 (SDA0) and 5 (SCL0).
 */

let I2C;
let raspi;
let _opt;

//IN=1, OUT=0
let dataDir  = [BYTE_INPUT, BYTE_INPUT, BYTE_INPUT, BYTE_INPUT];
let dataByte = [0x00, 0x00, 0x00, 0x00];

/**
 * Write a bit into the register
 | @param {Number} bankAddr 
 * @param {Number} currentByte 
 * @param {Number} bit 
 * @param {Number} value 
 */	
function writeReg(chipAddress, address, currentByte, bit, value){
	//brewlog.debug("writeReg", `0x${chipAddress.toString(16)}, 0x${address.toString(16)}, Bit ${bit}=${value}`);

	const mask = 1 << bit;
	let result;
	if (value == 1){
	  result = (currentByte | mask);
	}else if (value == 0){
	  result = (currentByte & ~mask);
	}else{
	  brewlog.critical("writeReg value=", `${value}`)
	}

	//setDir(bit, DIR_OUTPUT);
	_i2c.writeByteSync(chipAddress, address, result);
	//setDir(bit, DIR_INPUT);


	return result;
}

process.on('uncaughtException', (err) => {
	brewlog.critical('Uncaught Exception:', err.stack);
	process.exit(1); // Exit the process after logging the stack trace
});
  

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

function init(i2c){
	try {
	//Initialise all as inputs 
	brewlog.debug("INIT I2C")
	i2c.writeByteSync(REG20, 0x0, dataDir[0]);
	i2c.writeByteSync(REG20, 0x1, dataDir[1]);

	i2c.writeByteSync(REG21, 0x0, dataDir[2]);
	i2c.writeByteSync(REG21, 0x1, dataDir[3]);
	}
	catch (err) {
		if (err.errno == 121){
			brewlog.critical("Looks like there is no I2C hardware", err.message)
		}else{
			brewlog.critical("I2C init error", err.message)
		}
	}
	brewlog.debug("INIT I2C DONE");
}

function toString(bytes){
  const toHex = byte => `${byte.toString(16)}`;
  return bytes.reduce((acc, byte) => toHex(byte) + acc, '');
}


module.exports = { 
	DIR_INPUT,
	DIR_OUTPUT,
	start(opt) {
		return new Promise((resolve, reject) => {
			_opt = opt;
			const ispi = brewdefs.isRaspPi();
			const sim = (opt?.sim?.simulate === true);
			console.log (`raspi=${ispi}. sim=${sim}`);
			if (ispi && !sim) {
				raspi = require('raspi');
				I2C = require('raspi-i2c').I2C;
				_i2c = new I2C();
				raspi.init(()=>init(_i2c));
			}else{
				_i2c = require('../sim/raspi-i2c.js');
				init(_i2c);
			}
			resolve(opt);
		})
	},
	
	/** Set or clear any bit
	 * @param {number} bit - Bit number [0:31]
	 * @param {number} value - 0 or 1
	 */
    writeBit(bit, value) {
    	try {
			if (bit < 16) {
			  if (bit < 8) {
				dataByte[0] = writeReg(REG20, 0x12, dataByte[0], bit - (0 * 8), value);
			  } else {
				dataByte[1] = writeReg(REG20, 0x13, dataByte[1], bit - (1 * 8), value);
			  }
			} else {
			  if (bit < 24) {
				dataByte[2] = writeReg(REG21, 0x12, dataByte[2], bit - (2 * 8), value);
			  }else {
				dataByte[3] = writeReg(REG21, 0x13, dataByte[3], bit - (3 * 8), value);
			  }
			}
		  } catch (err) {
			brewlog.critcal('Error in writeBit:', JSON.stringify(err.stack));
		  }
	},
	
	/** Read any single bit
	 * @param {number} bit - Bit number [0:31]
	 */
    readBit(bit) {
	  // brewlog.debug("Read bit=>"+bit)
	  let result;
	  if (bit < 16){
	    if (bit < 8){
	      dataByte[0] = _i2c.readByteSync(REG20, 0x12);
	    //   brewlog.debug("Read [byte0]=>"+dataByte[0])
	      result = getBit(dataByte[0], bit); 
	    }else{		
	      dataByte[1] = _i2c.readByteSync(REG20, 0x13);
	    //   brewlog.debug("Read [byte1]=>"+dataByte[1])
	      result = getBit(dataByte[1], bit-8); 
	    }
	  }else{
	    if (bit < 24){
	      dataByte[2] = _i2c.readByteSync(REG21, 0x12);		
	        // brewlog.debug("Read [byte2]=>"+dataByte[2])
		result = getBit(dataByte[2], bit-16); 
	    }else{		
	      dataByte[3] = _i2c.readByteSync(REG21, 0x13);		
	    //   brewlog.debug("Read [byte3]=>"+dataByte[3])
	      result = getBit(dataByte[3], bit-24); 
	    }
	  }
		
	  return result;
	},
	
	/** Toggle any bit
	 * @param {number} bit - Bit number [0:31]
	 */
	toggleBit(bit) {
		this.writeBit(bit, (this.readBit(bit) === 0) ? 1 : 0);
	},
	
	/** Set direction of a single bit
	 * @param {number} bit - Bit number [0:31]
	 * @param {number} dir - DIR_INPUT | DIR_OUTPUT
	 * 
	BANK0:
	IO_DIR_A @ 0x0
	IO_DIR_B @ 0x1
	BANK1:
	IO_DIR_A @ 0x0
	IO_DIR_B @ 0x10
	 */
  	setDir,
  
    /**
     * @desc Initialise an individual bit.
	 * {number, dir, value} bitInfo
	 */
    init(bitInfo) {
		brewlog.debug("INIT", `${JSON.stringify(bitInfo)}`);
		this.setDir(bitInfo.number, bitInfo.dir);

		if (bitInfo.dir === this.DIR_OUTPUT){
			this.writeBit(bitInfo.number, bitInfo.value);
		}	
	},
	
	getWord() {
		try {
			const byte0 = _i2c.readByteSync(REG20, 0x12);
			const byte1 = _i2c.readByteSync(REG20, 0x13);
			const byte2 = _i2c.readByteSync(REG21, 0x12);		
			const byte3 = _i2c.readByteSync(REG21, 0x13);		
			
		//console.log(byte3,byte2,byte1,byte0);
			const word = (byte3 << 24) | (byte2 << 16) | (byte1 << 8) | byte0;
			
			return word;
		} catch (err) {
			brewlog.critical("getWord Error", `${err}`)
			//restart
			this.start(_opt)
		}

	}
}

function setDir(bit, dir) {
	// brewlog.debug(`BEFORE bit ${bit}=${dir} I2C DIR BITS`, `${toString(dataDir)}`);
	if (bit < 16){
		if (bit < 8){
			dataDir[0] = writeReg(REG20, 0x0, dataDir[0], bit-(0*8), dir); 
		}else{		
			dataDir[1] = writeReg(REG20, 0x1, dataDir[1], bit-(1*8), dir); 
		}
	} else {
		if (bit < 24){
			dataDir[2] = writeReg(REG21, 0x0, dataDir[2], bit-(2*8), dir); 
		}else{		
			dataDir[3] = writeReg(REG21, 0x1, dataDir[3], bit-(3*8), dir); 
		}
	}
	// brewlog.debug("AFTER I2C DIR BITS", `${toString(dataDir)}`);
}
