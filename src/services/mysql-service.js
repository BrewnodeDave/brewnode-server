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


/**
 * Creates a table in the MySQL database if it does not already exist.
 *
 * @param {string} tableName - The name of the table to be created.
 */
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

/**
 * Sanitizes a brew name by replacing any character that is not a letter, number, or underscore with an underscore.
 * Ensures the name starts with a letter or underscore and truncates the result to 64 characters.
 *
 * @param {string} brewname - The brew name to sanitize.
 * @returns {string} - The sanitized brew name.
 */
function sanitizeBrewName(brewname) {
    let sanitized = brewname.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!/^[a-zA-Z_]/.test(sanitized)) {
        sanitized = '_' + sanitized;
    }
    return sanitized.substring(0, 64);
}


/**
 * Establishes a connection to the MySQL database and creates a session-specific table.
 * 
 * @param {string} name - The name of the brew session.
 * @returns {Promise<number>} - A promise that resolves with the MySQL connection thread ID.
 * @throws {Error} - If there is an error connecting to the MySQL database.
 */
function start(name){
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
				start(opt); // Reconnect on connection loss
			} else {
				throw err;
			}
		});
	});
} 

/**
 * Inserts a name and value into the current session's table in the MySQL database.
 * 
 * @param {string} name - The name to be inserted.
 * @param {any} value - The value to be inserted, which will be stringified.
 * @returns {Promise} - A promise that resolves if the insertion is successful or if certain conditions are met, and rejects if there is an error during the query execution.
 */
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

/**
 * Stops the MySQL connection.
 * 
 * @returns {Promise<void>} A promise that resolves when the connection is successfully closed, or rejects with an error if the connection could not be closed.
 */
function stop(){
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
	start,
	stop
}
