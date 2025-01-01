/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const mysql  = require('mysql');

let _connection;
let _session;

const setSession = brewname => _session = `${brewname ? brewname : "none"}`;
const getSession = () => _session;

const setConnection = c => _connection = c;
const getConnection = () => _connection;


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

function setBrewname(name){
	const connection = getConnection();
	const result = {};

	if (connection){
		const brewname = sanitizeBrewName(name);

		setSession(brewname);
		
		const tableName = getSession();

		const createTableQuery = `
			CREATE TABLE IF NOT EXISTS ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, value JSON NOT NULL, timestamp TIMESTAMP  DEFAULT CURRENT_TIMESTAMP)`;

		connection.query(createTableQuery, (err, results) => {
			result.err = err 
				? `Error creating table: ${err}`
				: `Table ${tableName} created or already exists.`;
    	});

		return `Brewname set to ${name}`
	}else{
		result.err = "Can't set brewname, no connection";
	}

	return result;
}


function start(){
	return new Promise((resolve, reject) => {
		const c = mysql.createConnection({
			host     : '192.185.20.89',
			// user     : 'dleitch_brewnode',
			user     : 'dleitch_temp',
			// password : 'CIG)74&C}xBd',
			password : 'Brewnode.co.uk',
			database : 'dleitch_brewnode'
		});

		setConnection(c);
	
		c.connect((err) => {
			if (err) {
				reject(err);
			}else{
				console.log('MySQL Connected');
        
				resolve(_connection.threadId);
			}
		});

		getConnection().on('error', (err) => {
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
function brewData(name, value){
	 return new Promise((resolve, reject) => {
		const tablename = getSession();
		if (tablename === undefined || name.includes("Flow") || name.includes("log") || name.includes("Watchdog")){
			resolve();
			return;
		}

		const query = `INSERT INTO ${tablename} (name, value) VALUES (?, ?)`;
		const values = [name, JSON.stringify(value)];
		
		if (_connection != undefined){
			_connection.query(query, values, function (error, results, fields) {
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
		_connection.end((err) => {
			if (err) {
				reject(err);
			}
			else resolve();
		});
	});
}

module.exports = {
	brewData,
	setBrewname,
	start,
	stop
}
