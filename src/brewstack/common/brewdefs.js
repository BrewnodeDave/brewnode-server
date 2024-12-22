/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Brewnode Definitions
 * @module brewdefs
 * @author Dave Leitch
 * @desc Raspberry Pi GPIO and I2C pin definitions.
 */

const fs = require('fs');

/**
 * Checks if the current platform is a Raspberry Pi.
 *
 * This function determines if the current platform is running on a Raspberry Pi
 * by first checking if the operating system is Linux. If it is, it reads the
 * contents of the '/etc/os-release' file to check for specific identifiers
 * ('Raspbian' or 'bullseye') that indicate a Raspberry Pi.
 *
 * @returns {boolean} True if the platform is a Raspberry Pi, false otherwise.
 */
function isRaspPi(){
	const isLinux = /^linux/.test(process.platform);
	if (isLinux){
		const cpuInfo = fs.readFileSync('/etc/os-release', 'utf8');
		return cpuInfo.includes('Raspbian') || cpuInfo.includes('bullseye');
	}
}

const dotenv = require('dotenv');
dotenv.config();//Adds contents of .env tsso environ vars e.g. process.env.DB_PASS

module.exports = {
	//installDir: '.',	
	installDir: `${__dirname}/../..`,	
	brewsDir: '/brews/',
	
	isLinux: /^linux/.test(process.platform),
	isRaspPi,

	WATER_TO_GRIST: 		3,//2.69, //L/Kg
	PIPE_LOSSES: 			1.7, //What gets left behind in the pipework and vessels.
	TRUB_LOSSES:			4, //Volume left in Fermenter
	MASHTUN_LOSSES:			5, //Volume under false bottom

	EVAP_RATE_L_PER_HOUR: 	6,
	ROLLBAR: 				true, //Report all messages to Rollbar?
	ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN: process.env.ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN,
	// //I2C bits 0:31
	// I2C_FLOW_FERMENT:		31,//30,
	// I2C_FLOW_KETTLE_IN:		30,//31,
	// I2C_FLOW_MASH_OUT:		29,
	// I2C_FLOW_MASH_IN:		28,
	// I2C_FLOW_KETTLE_OUT:	27,

	// I2C_FLOW_FERMENT:		31,//30,
	// I2C_FLOW_KETTLE_IN:		30,//31,
	// I2C_FLOW_MASH_OUT:		29,
	// I2C_FLOW_KETTLE_OUT:	28,

	// I2C_FLOW_FERMENT:		31,//30,
	// I2C_FLOW_KETTLE_IN:		30,//31,
	// I2C_FLOW_MASH_OUT:		28,
	// I2C_FLOW_KETTLE_OUT:	29,

	I2C_FLOW_FERMENT:		31,//30,
	I2C_FLOW_KETTLE_IN:             30,//31,
	I2C_FLOW_MASH_OUT:              29,
	// I2C_FLOW_MASH_IN:               28,
	I2C_FLOW_KETTLE_OUT:    27,

	I2C_KETTLE_OUTPUT_BIT:	26,
	
	I2C_WATCHDOG_HALT_BIT:	23,

	I2C_RELAY_3:	 		1,
	I2C_HEAT_OUTPUT_BIT:	2, //kettle heater		
    I2C_MASH_PUMP: 			3, //mash pump
	I2C_FERMENTER_PUMP: 	4,
	I2C_KETTLE_VALVE_IN: 	5,
	I2C_RELAY_12:	 		6,
	I2C_FERMENTER_VALVE_IN: 7, //BROKEN ???????
	I2C_GLYCOL_PUMP: 		8, //glycol pump
	I2C_CHILL_WORT_VALVE_IN:9, //valve 3
	I2C_RELAY_13:	 		10, //unused
	I2C_MASH_IN_VALVE: 		11, //mash in valve
	I2C_KETTLE_PUMP: 		12, //ketttle pump
	I2C_FAN_OUTPUT_BIT:		13,	//extractor fan
	I2C_RELAY_4:	 		14,
	I2C_RELAY_2:	 		15,
	I2C_WATCHDOG_LED_BIT: 	22,

	
	//GPIO Numbers
	GPIO_VALVE0_CLOSED:		40,
	
	GPIO_VALVE0_OPENED:		38,
	GPIO_VALVE1_OPENED:		37,
	GPIO_VALVE2_OPENED:		36,
	GPIO_VALVE1_CLOSED:		35,
	
	GPIO_VALVE2_CLOSED:		33,
	GPIO_VALVE3_OPENED:		32,

	GPIO_ADC_CLK:        	26,
	GPIO_ADC_DATA:	    	24,

	GPIO_VALVE3_CLOSED:		22, 
	GPIO_VALVE7_CLOSED: 	21,

	GPIO_VALVE7_OPENED:		19,	
	GPIO_VALVE4_OPENED:		18,
	
	GPIO_VALVE4_CLOSED:		16,
	GPIO_VALVE5_OPENED:		15,
	
	GPIO_VALVE5_CLOSED:		13,
	GPIO_VALVE6_CLOSED:		12,
	GPIO_VALVE6_OPENED:		11,
	
	GPIO_TEMP:				4,
	
	VALVE_STATUS: {
		CLOSED: "Closed",
		OPENING:"Opening",
		OPENED: "Opened",
	},	
};

