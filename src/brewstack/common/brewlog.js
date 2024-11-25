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

//These 3 are to provide json-fs-store sync functions
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;


const brewdefs = require('./brewdefs.js');
// create a stdout and file logger
// @ts-ignore
const simpleNodeLogger = require('simple-node-logger');

let _publishLog;
let rollbar;
// @ts-ignore
const Rollbar = require('rollbar');

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

//brewid
let gLogger = console;
let gLogDir;

const gSensorLogger = [];

let _debug = false;

const sendToClient = entry => function () {
	_publishLog(entry);
}

module.exports = {
	/**
	 * @desc Create a new dir for sensor all log files. Initialise logging.
	 * 
	 */
	start(opt, debug) {
		_debug = debug;
		return new Promise((resolve, reject) => {

			opt.filename = (opt.brewname === undefined) ? "debug" : opt.filename;

			const brewDir = `${brewdefs.installDir}${brewdefs.brewsDir}${opt.filename}`;
			fs.mkdir(brewDir, err => {
				if (err) {
					if (err.code !== 'EEXIST') {
						console.error("Failed to create log dir", gLogDir);
						reject(err);
						return;
					}
				}

				gLogDir = `${brewdefs.installDir}${brewdefs.brewsDir}${opt.filename}/logs`;
				fs.mkdir(gLogDir, err => {
					if (err) {
						if (err.code !== 'EEXIST') {
							console.error("Failed to create log dir", gLogDir);
							reject(err);
						}
					}

					if (opt.sim.resetLog === true) {
						if (opt.sim.simulate === true) {
							//windows
							let dir = path.resolve(`${gLogDir}/*`);
							if (brewdefs.isLinux) {
								let cmd = `rm "${dir}" -rf`;
								console.error("ERROR", cmd);
							} else {
								execSync(`del ${dir} /S /Q`);
							}
						} else {
							execSync(`rm -rf "${gLogDir}/*"`);
						}
					}
					const logFile = `${gLogDir}/log.txt`;

					// create a stdout and file logger
					const opts = {
						logFilePath: logFile,
						timestampFormat: 'HH:mm:ss'
					}
					gLogger = simpleNodeLogger.createSimpleLogger(opts);
					// // override the standard error method to send a socket message
					// gLogger.info = function() {
					//     var args = Array.prototype.slice.call( arguments ),
					//         entry = gLogger.log('info', args);

					//     // now do something special with the log entry...
					//     process.nextTick(function() {
					// 		_publishLog(`${args.msg} ${args.data}`);
					// 	});
					// };
					resolve(opt);
				})
			});

		});
	},

	stop() {
		return new Promise((resolve, reject) => {
			_publishLog = null;
			gSensorLogger.forEach(logger => {
				logger = undefined;
			});
			resolve();
		});
	},

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

	startSync

}


function startSync(opt, publishLog, debug) {
	_debug = debug;
	_publishLog = publishLog;
	opt.filename = (opt.brewname === undefined) ? "debug" : opt.filename;

	const brewDir = path.resolve(`${brewdefs.installDir}${brewdefs.brewsDir}${opt.filename}`);
	//fs.mkdirSync(brewDir);

	gLogDir = path.resolve(`${brewdefs.installDir}${brewdefs.brewsDir}${opt.filename}/logs`);
	//fs.mkdirSync(gLogDir);

	if (opt.sim.resetLog === true) {
		if (opt.sim.simulate === true) {
			//windows
			let dir = path.resolve(`${gLogDir}/*`);
			if (brewdefs.isLinux) {
				let cmd = `rm "${dir}" -rf`;
			} else {
				try {
					const f = fs.statSync(gLogDir);
					if (f.isDirectory()) {
						execSync(`del ${dir} /S /Q`);
					}
				} catch (err) {
					console.log(err)
				}
			}
		} else {
			execSync(`rm -rf "${gLogDir}/*"`);
		}
	}

	const logFile = path.resolve(`${gLogDir}/log.txt`);

	gLogger = simpleNodeLogger.createSimpleLogger({
		// logFilePath:logFile,
		timestampFormat: 'HH:mm:ss',
		level: 'all'
	});

	// override the standard error method to send a socket message
	gLogger.info = foo('info');
	gLogger.warn = foo('warn');
	gLogger.debug = foo('debug');
	gLogger.error = foo('error');

	function foo(logType) {
		return function () {
			var args = Array.prototype.slice.call(arguments),
				entry = gLogger.log(logType, args);
			process.nextTick(sendToClient(entry));
		}
	};

	return opt;
}
