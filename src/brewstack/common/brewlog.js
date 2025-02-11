/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Brewnode Logger
 * @module brewlog
 * @desc Provides functions to logs all messages to Rollbar and a local text file.
 */


const brewdefs = require('./brewdefs.js');
let rollbar;
const Rollbar = require('rollbar');
const mysqlService = require('../../services/mysql-service.js');

let prevPower = null;
if (brewdefs.ROLLBAR === true) {
	rollbar = new Rollbar({
		accessToken: brewdefs.ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN,
		captureUncaught: true,
		captureUnhandledRejections: true,
	});
} else {
	rollbar = { init() { }, debug(a, b) { }, info(a, b) { }, warning(a, b) { }, error(a, b) { }, critical(a, b) { } };
}

let gLogger = console;

const gSensorLogger = [];

let _debug = false;


module.exports = {
	sensorStop(sensorName) {
		gSensorLogger[sensorName] = undefined;
	},

	/** append data value to sensor log file */
	sensorLog(sensorName, value) {
		if (gSensorLogger[sensorName] === undefined) {
			return;
		} else {
			if (sensorName === "Watchdog") {
				//Don't write watchdog to logfile or console
			}
			else if (sensorName === "Heater") {
				//Don't write heater to console
				gSensorLogger[sensorName].info(`${value}`);
			}
			else if (sensorName.substring(0, 4) === "Flow") {
				gSensorLogger[sensorName].info(`${value.rate},${value.delta}`);
			}
			else if (sensorName === "Power") {
				gSensorLogger[sensorName].info(`${value}`);
				//Only write delta to console		
				if (value !== prevPower) {
				}
				prevPower = value;
			} else {
				const entry = gSensorLogger[sensorName].info(`${value}`);
			}
		}
	},

	info(msg, data = '') {
		if (data) {
			if (gLogger) {
				gLogger.info(msg, ` ${data}`);
			}
		} else {
			if (gLogger) {
				gLogger.info(msg);
			}
		}
		mysqlService.log(`${msg}: ${data}`);
	},

	warning(msg, data = '') {
		//_publishLog(`${msg} ${data}`);
		rollbar.warning(msg);
		if (data) {
			gLogger.warn(msg, ` ${data}`);
		} else {
			gLogger.warn(msg);
		}
	},

	error(msg, data = '') {
		//_publishLog(`${msg} ${data}`);

		rollbar.error(msg, data, (err, data2) => {
			if (err) {
				console.error("ROLLBAR: an error occurred", err);
			}
		});

		if (data) {
			gLogger.error(msg, ` ${data}`);
		} else {
			gLogger.error(msg);
		}
	},

	critical(msg, data = '') {
		console.log(data);
		rollbar.critical(msg);
		if (data) {
			gLogger.error(msg, ` ${data}`);
		} else {
			gLogger.error(msg);
		}
	},

	debug(msg, data = '') {
		//rollbar.debug(msg);
		//_publishLog(`${msg} ${data}`);

		if (_debug) {
			gLogger.debug(msg, ` ${data}`);
		}
	},


}

