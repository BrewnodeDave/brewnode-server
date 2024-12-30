/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const mysql  = require('mysql');

let connection;
let _session;


function createBrewTable(tableName) {
    const createTableQuery = `
		CREATE TABLE IF NOT EXISTS ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, value JSON NOT NULL, timestamp TIMESTAMP  DEFAULT CURRENT_TIMESTAMP)`;

    connection.query(createTableQuery, (err, results) => {
        if (err) {
            console.error('Error creating table:', err);
        } else {
            console.log(`Table ${tableName} created or already exists.`);
        }
    });
}

function sanitizeBrewName(brewname) {
    // Replace any character that is not a letter, number, or underscore with an underscore
    let sanitized = brewname.replace(/[^a-zA-Z0-9_]/g, '_');
    // Ensure the name starts with a letter or underscore
    if (!/^[a-zA-Z_]/.test(sanitized)) {
        sanitized = '_' + sanitized;
    }
    // Truncate to 64 characters
    return sanitized.substring(0, 64);
}


function connect(name){
	return new Promise((resolve, reject) => {
		connection = mysql.createConnection({
			host     : '192.185.20.89',
			user     : 'dleitch_brewnode',
			password : 'CIG)74&C}xBd',
			database : 'dleitch_brewnode'
		});
	

		connection.connect((err) => {
			if (err) {
				reject(err);
			}else{
				console.log('MySQL Connected');

				const date = new Date();
				const formattedDate = `${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}`;
	
				const brewname = sanitizeBrewName(name);

				_session = `brew_${brewname ? brewname : "none"}_${formattedDate}`;
	
				createBrewTable(_session);
        
				resolve(connection.threadId);
			}
		});

		connection.on('error', (err) => {
			console.error('MySQL error:', err.code);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				connect(opt); // Reconnect on connection loss
			} else {
				throw err;
			}
		});
	});
} 

function insert(name, value){
	return new Promise((resolve, reject) => {
		if (_session === undefined || name.includes("Flow") || name.includes("log") || name.includes("Watchdog")){
			resolve();
			return;
		}

		const query = `INSERT INTO ${_session} (name, value) VALUES (?, ?)`;
		const values = [name, JSON.stringify(value)];
		
		if (connection != undefined){
			connection.query(query, values, function (error, results, fields) {
				if (error) {
					reject(error);
				}else{
					resolve(results);
				}
			});
		}else{
			resolve();
		}
	});		
}

function disconnect(){
	return new Promise((resolve, reject) => {
		connection.end((err) => {
			if (err) {
				reject(err);
			}
			else resolve();
		});
	});
}

module.exports = {
	insert,
	setSession: s => _session = s,
	start: connect,
	stop: disconnect
}
