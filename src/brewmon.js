/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/* This sends all hardware events to a websocket
*/

const port = 8080;
const http = require('http');
let _httpServer;

const brewlog = require('./brewlog.js');
const broker = require('./broker.js');
// @ts-ignore
const socketio = require('socket.io');
const end = (/** @type {{ end: (arg0: string) => void; }} */ response) => (/** @type {any} */ status) => {
	brewlog.debug(JSON.stringify(status));
	response.end(JSON.stringify(status));
}

/**
 * @param {{ on: (arg0: string, arg1: { ({ handshake }: { handshake: any; }): void; (socket: any): void; }) => void; emit: any; }} serverSocket
 */
function initialiseClient(serverSocket) {	  	
  	serverSocket.on('disconnect', ({handshake}) => {
		console.log('Client disconnected',handshake.address);  	
	});
	
	serverSocket.on('connect', (clientSocket) => {	
		// console.log('connect',socket.id);
		if (broker.exists(clientSocket) === false){
			console.log('Client Connected from', clientSocket.conn.remoteAddress);  

			clientSocket.on('disconnect', (reason) => {
				if (reason === 'io server disconnect'){
					//client.connect();
				}
				broker.detach(clientSocket);			
			});		

			broker.attach(clientSocket);
		}else {
			//console.error('connect: broker socket already exists');
		}	
	});
	broker.setEmitFn(serverSocket.emit);
}


/**
 * @param {{}} options
 */
function start(options) {
	const opt = options || {};
	return new Promise((resolve, reject) => {	
		_httpServer = http.createServer(serverHandler);
		const serverSocket = socketio(_httpServer);
		initialiseClient(serverSocket);

		_httpServer.listen(port, () => {
			brewlog.info("server started on port", port.toString());
			resolve(opt);
		});
	});
}
	
function stop() {
	return new Promise((resolve, reject) => {
			if (_httpServer){
				_httpServer.close();
				brewlog.info("brewmon stop");
			}
			resolve();	
	});		
}

module.exports = { 
	server: _httpServer,
	start,
	stop
}
