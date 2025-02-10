/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Event Broker
 * @module broker
 * @desc Broker publish and subscription sensor events.
 */


  const brewlog = require("./brewstack/common/brewlog.js");
  const mysql = require("./services/mysql-service.js");
  
  const EventEmitter = require("events").EventEmitter;
  const sensor = new EventEmitter();

  //socket
  const clients = [];
  let _socket = null;
  let _emit;

  //listeners
  /* @type {string[]} */
  const sensorNames = [];

  let debug = false;

  const progressPublish = create("Progress");

  sensor.setMaxListeners(100);

  
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

/**
 * @param {String} sensorName
 * @return {Function} Function to be used to publish this event  
 */
function create(sensorName) {
   sensorNames.push(sensorName);	
   
   //return a publish function
   return async (value, timestamp) => {    
	   	if (_socket){
		   _socket.broadcast.emit(sensorName,  value);
		   _socket.emit(sensorName,  value);
	   	}

	   	sensor.emit(sensorName, value);
		const dt = timestamp ? timestamp : new Date().getTime();
		const mysqlDatetime = new Date(dt).toISOString().slice(0, 23).replace('T', ' ');
        try{
			await mysql.brewData(sensorName, value, mysqlDatetime);
		}catch(err){
			brewlog.error(`Failed to publish ${sensorName} to mysql`, err);
		}

		clients.forEach(client => {
			if (client.connected){
			   client.emit(sensorName,  value);
			   client.broadcast.emit(sensorName,  value);
		   	}
	   });
   };		
}		


 module.exports = {	
	 /**
	  * @param {any} emit
	  */
	 setEmitFn(emit){
		_emit = emit;
	 },

	create,  
	
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
			sensor.on(sensorName, cb);
			return cb;
		}else{
			brewlog.error(`Broker cannot subscribe, sensor=${sensorName} does not exist.`);
		}

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
		if (listener) sensor.removeListener("sensor", listener);
		listener = null;
		sensor.removeAllListeners("sensor");
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


		// Catch socket disconnect
		_socket.on('disconnect', () => {
			console.log(`Socket ${_socket.id} disconnected`);
			// Perform any necessary cleanup or logging here
		});
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

	progressPublish,
	
	remainingFillLitres:create("remainingFillLitres"),
	remainingBoilMinutes: create("remainingBoilMinutes"),
	remainingKettleMinutes: create("remainingKettleMinutes"),
	remainingMashMinutes: create("remainingMashMinutes"),
	remainingFermentDays:create("remainingFermentDays")
  }
