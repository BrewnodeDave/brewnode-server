const EventEmitter = require("events").EventEmitter;
const emitter = new EventEmitter();

//socket
const clients = [];
let webSocket = null;

const sensorNames = [];


function exists(s) {
	let found = false;
	//Check if it's already connected
	clients.forEach(({ conn }) => {
		//if (socket){
		if (s.conn.remoteAddress == conn.remoteAddress) {
			found = true;
		}
		//}
	});

	return found;
}

let _emit;
module.exports = {
	/**
	 * @param {String} sensorName
	 * @return {Function} Function to be used to publish this event  
	 */
	create(sensorName) {
		sensorNames.push(sensorName);
		return (value) => {
			const timeStamp = new Date().getTime();
			brewlog.sensorLog(sensorName, value);

			emitter.emit("sensor", {
				name: sensorName,
				date: timeStamp,
				value
			});

			if (webSocket) {
				webSocket.broadcast.emit(sensorName, { date: timeStamp, value });
				webSocket.emit(sensorName, { date: timeStamp, value });
			}
		};
	},

	/**
	 * @desc Remove publish function.
	 * @param {String} sensorName
	 */
	destroy(sensorName) {
		brewlog.info("DESTROY", sensorName)
		brewlog.sensorStop(sensorName);

		//Remove entry from array
		let index = sensorNames.indexOf(sensorName);
		if (index !== -1) {
			sensorNames.splice(index, 1);
		}
	},


	subscribe(sensorName, handler) {
		if (sensorNames.includes(sensorName)) {
			emitter.on("sensor", listener);
		} else {
			brewlog.error(`Broker cannot subscribe, sensor=${sensorName} does not exist.`);
		}

		return listener;

		function listener(value) {
			if (value.name == sensorName) {
				handler(value);
			}
		}
	},

	/**
	 * Stop subscribing to a sensor 
	 * @param {*} listener 
	 */
	unSubscribe(listener) {
		if (listener) emitter.removeListener("sensor", listener);
		listener = null;
		emitter.removeAllListeners("sensor");
	},

	exists,

	/**
	 * @desc Attach a socket that listens to all events
	 * @param {Object} socket - Socket 
	 */
	attach(socket) {
		webSocket = socket;
		if (exists(socket) === false) {
			clients.push(socket);
			console.log(`New Attached client ${socket.conn.remoteAddress}`);
		}
	},

	/**
	 * @desc Remove a previously attached socket
	 * @param {Object} c - Client 
	 */
	detach({ conn }) {
		clients.forEach(({ conn }, index) => {
			if (conn.remoteAddress == conn.remoteAddress) {
				clients[index] = null;
				clients.splice(index, 1);

				console.log(`Detached client ${conn.remoteAddress}`);
			}
		});
		webSocket = null;
	},

}
