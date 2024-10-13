/**
 * Event Broker
 * @module broker
 * @desc Broker publish and subscription sensor events.
 */


  const brewlog = require("./brewlog.js");
  
  const EventEmitter = require("events").EventEmitter;
  const emitter = new EventEmitter();

  emitter.setMaxListeners(1000);

  //socket
  const clients = [];
  let _socket = null;
  let _emit;

  //listeners
  /* @type {string[]} */
  const sensorNames = [];

  let debug = false;
  
  /**
 * @param {{ conn: { remoteAddress: any; }; }} socket
 */
  function exists(socket){
	let found = false;
	//Check if it's already connected
	clients.forEach(({conn}) => {
		//if (socket){
			if (socket.conn.remoteAddress == conn.remoteAddress){
				found = true;
			}
		//}
	});

	return found;
 }

 module.exports = {
	 /**
	  * @param {any} emit
	  */
	 setEmitFn(emit){
		_emit = emit;
	 },

	 /**
	  * @param {String} sensorName
	  * @return {Function} Function to be used to publish this event  
	  */
 	create(sensorName) {
		sensorNames.push(sensorName);	
		
		//return a publish function
		return (/** @type {any} */ value, emit=true) => {    
			let timeStamp = new Date().getTime();
			brewlog.sensorLog(sensorName, value);
			if (_socket){
				// _socket.broadcast.emit(sensorName,  {date: timeStamp, value});
				// _socket.emit(sensorName,  {date: timeStamp, value});
			}
			if (emit){
				emitter.emit("sensor", {
					name: sensorName, 
					date: timeStamp, 
					value});
			}
			
			clients.forEach(client => {
				if (client.connected){
					client.emit(sensorName,  {date: timeStamp, value});
					client.broadcast.emit(sensorName,  {date: timeStamp, value});
				}
			});
		};		
	},		  
	
	/**
	   * @param {boolean} onOff
	   */
	debug(onOff){
		debug = onOff;
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
	
	/**
	 * @desc Pass in a function to call when a sensor event fires.
	 * @param {String} sensorName 
	 * @param {Function} cb - Publish callback 
	 */
    subscribe(sensorName, cb) {
		if (sensorNames.includes(sensorName)){
			brewlog.info("subscribe", sensorName);
			emitter.on("sensor", value => {
				if (value.name == sensorName){
					cb(value);
				}
			});
						
		}else{
			brewlog.error(`Broker cannot subscribe, sensor=${sensorName} does not exist.`);
		}

		return listener;
		
		/**
		 * @param {{ name: string; }} value
		 */
		function listener(value) {
			if (value.name == sensorName){
				cb(value);
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
		_socket = socket;
		// console.log(`Attached client ${socket.conn.remoteAddress}`);
		// return;
        if (exists(socket) === false) {
			clients.push(socket);
			console.log(`New Attached client ${socket.conn.remoteAddress}`);
        }
    },
		
	/**
	 * @desc Remove a previously attached socket
	 * @param {Object} c - Client 
	 */
	detach({conn}) {
		console.log(`Detached client ${conn.remoteAddress}`);
		// return;
		clients.forEach(({conn}, index) => {
			if (conn.remoteAddress == conn.remoteAddress){
				clients[index] = null;
				clients.splice(index, 1);

				console.log(`Detached client ${conn.remoteAddress}`);
			}
		});
		_socket = null;
	},

  }
