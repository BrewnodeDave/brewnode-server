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

const path = require('path');
const fs = require('fs');

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

function filePath() {
	const logFile = path.join(__dirname, '../log.txt');
	if (!fs.existsSync(logFile)) {
		fs.writeFileSync(logFile, '');
	}

	return logFile;
}

function deleteAllLogs() {
	const logFile = filePath();
	if (fs.existsSync(logFile)) {
		fs.unlinkSync(logFile);
		return true; 
	}
	return false;
}

function log(type, message, data='') {
	const logFile = filePath();
	const timeStamp = new Date().toISOString();

	// Add icons for each log type
	const icons = {
		info: 'ℹ️',
		warn: '⚠️',
		error: '❌',
		debug: '🐛'
	};
	
	const icon = icons[type] || '';
	const string = `${timeStamp} ${icon} ${message} : ${data}`;
	fs.appendFileSync(logFile, `${string}\n`);
console.log(string);
	// logPublish(string); // Commented out to avoid circular dependency

}	

let gLogger = {
	info: (message, data) => log('info', message, data),
	warn: (message, data) => log('warn', message, data),
	error: (message, data) => log('error', message, data),
	debug: (message, data) => log('debug', message, data)
}

let _debug = false;

module.exports = {
	deleteAllLogs,
	filePath,
	sensorStop(sensorName) {
		gLogger = undefined;
	},

	/** append data value to sensor log file */
	sensorLog(sensorName, value) {
		if (gLogger === undefined) {
			return;
		} else {
			if (sensorName === "Watchdog") {
				//Don't write watchdog to logfile or console
			}
			else if (sensorName === "Kettle Heater") {
				//Don't write heater to console
				gLogger.info(`${value}`);
			}
			else if (sensorName.substring(0, 4) === "Flow") {
				gLogger.info(`${value.rate},${value.delta}`);
			}
			else if (sensorName === "Power") {
				gLogger.info(`${value}`);
				//Only write delta to console		
				if (value !== prevPower) {
				}
				prevPower = value;
			} else {
				gLogger.info(`${value}`);
			}
		}
	},

	info(msg, data = '') {
		if (gLogger === undefined) {
			return;
		} else {
			if (data) {
				gLogger.info(msg, ` ${data}`);
			} else {
				gLogger.info(msg);
			}
		}
		mysqlService.log(`${msg}: ${data}`);
	},

	warn(msg, data = '') {
		//_publishLog(`${msg} ${data}`);
		rollbar.warning(msg);
		if (gLogger === undefined) {
			return;
		} else {
			if (data) {
				gLogger.warn(msg, ` ${data}`);
			} else {
				gLogger.warn(msg);
			}
		}
	},

	error(msg, data = '') {
		if (gLogger === undefined) {
			return;
		} else {
			rollbar.error(msg);
			if (data) {
				gLogger.error(msg, ` ${data}`);
			} else {
				gLogger.error(msg);
			}
		}	
	},

	critical(msg, data = '') {
		if (gLogger === undefined) {
			return;
		} else {
			rollbar.critical(msg);
			if (data) {
				gLogger.error(msg, ` ${data}`);
			} else {
				gLogger.error(msg);
			}
		}
	},

	debug(msg, data = '') {
		if (gLogger === undefined) {
			return;
		} else {
			//rollbar.debug(msg);
			if (_debug) {
				gLogger.debug(msg, ` ${data}`);
			}
		}
	},


}

