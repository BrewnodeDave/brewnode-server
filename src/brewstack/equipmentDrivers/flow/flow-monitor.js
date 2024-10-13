/*


E.g. Switch on watchdog led  =>  
	DIR:0=out: 
	i2cset -y 1 0x21 0x0 0xB0
	i2cset -y 1 0x21 0x12 0x40
	 Close Valve 0
	DIR:0=out:
		i2cset -y 1 0x20 0x1 0xFE
	i2cset -y 1 0x20 0x13 0x1

Flow 7	0x21	0x13	0x80	31	In
Flow 6	0x21	0x13	0x40	30	In	
Flow 5	0x21	0x13	0x20	29	In	
Flow 4	0x21	0x13	0x10	28	In	
Flow 3	0x21	0x13	0x8	27	In	
Flow 2	0x21	0x13	0x4	26	In
Flow 1	0x21	0x13	0x2	25	In
Flow 0	0x21	0x13	0x1	24	In	


I2C_FLOW_FERMENT:		31,//30,
	I2C_FLOW_KETTLE_IN:             30,//31,
	I2C_FLOW_MASH_OUT:              29,
	// I2C_FLOW_MASH_IN:               28,
	I2C_FLOW_KETTLE_OUT:    27,


	dataDir[3] = writeReg(REG21, 0x1, dataDir[3], bit-24, dir); 
	i2cget -y 1 0x21 0x13
A1,81,21,01 => ferment+mashout,ferment,mashout

k2m => B1,31 = 1011,0011 =>ferment+mashout. => k2m use mashout or rename

hold on, need to set dir as input first
writeReg(REG21, 0x1, 0xFF, bit-(3*8), dir); 
i2cset -y 1 0x21 1 0xFF
this give 5b or fb => 01011011 or 11111010 =>bit31 & bit29

with m2k gives 5,F,7,D => 0101 1111 0111 1101 => bit29 & bit31




*/



const i2c = require('../../nodeDrivers/i2c/i2c_raspi.js');
const brewlog = require("../../../common/brewlog.js");

const flow = require('./flow.js');

const opt = {
	debug: true,
	flowReportSecs: 1,
	sim: {
		simulate: false,
		speedupFactor: 1
	}
}

const debug = true;
brewlog.start(opt, debug)
	.then(i2c.start)
	.then(flow.start)
	// .then(flow.stop)
	.then(console.log)
	.catch(e => console.error(e));

