/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const mysql  = require('mysql');

let _session;

const setSession = brewname => _session = `${brewname ? brewname : "none"}`;
const getSession = () => _session;


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

async function setBrewname(name){
	const connection = await connect();//getConnection();
	
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

		connection.end();
				
		return `Brewname set to ${name}`
	}else{
		c.end();
					
		result.err = "Can't set brewname, no connection";
	}

	return result;
}

function connect(){
	return new Promise((resolve, reject) => {
		const connection = mysql.createConnection({
			host     : process.env.DB_HOST,
			user     : process.env.DB_USER,
			password : process.env.DB_PASSWORD,
			database : process.env.DB_NAME
		});

		connection.on('error', async (err) => {
			console.error('MySQL error:', err.code);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				//
			} else {
				throw err;
			}
		});

		connection.connect((err) => {
			if (err) {
				reject(err);
			}else{
				resolve(connection);
			}
		});

	
	});
}


async function start(){
	return;
	return new Promise((resolve, reject) => {
		const c = mysql.createConnection({
			host     : process.env.DB_HOST,
			user     : process.env.DB_USER,
			password : process.env.DB_PASSWORD,
			database : process.env.DB_NAME
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
				start(); // Reconnect on connection loss
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
async function brewData(name, value){
	 	const tablename = getSession();
		if (tablename === undefined || name.includes("Flow") || name.includes("log") || name.includes("Watchdog")){
			return;
		}

		const query = `INSERT INTO ${tablename} (name, value) VALUES (?, ?)`;
		const values = [name, JSON.stringify(value)];
		
		const connection = await connect();
		connection.on('error', (err) => {
			console.error('MySQL error:', err.code);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				connect(); // Reconnect on connection loss
			} else {
				throw err;
			}
		});


		if (connection != undefined){
			try{
				connection.query(query, values, function (error, results, fields) {
					if (error) {
						connection.end();
						throw(error);
					}else{
						connection.end();
						return results;
					}
				});
			}catch(err){
				connection.end();
				throw(err);
			}
		}
}

function getBrewData(name){
	return new Promise((resolve, reject) => {
		const tablename = sanitizeBrewName(name);

		const query = `SELECT * FROM ${tablename}`;
		const values = [];
		
		connect().then(connection => {
			if (connection != undefined){
				connection.query(query, values, function (error, results, fields) {
					if (error) {
						reject(error);
					}else{
						// Transform the results into a series of arrays
						const timeSeries = [];
						results.forEach(row => {
							const name = row.name;
							const timestamp = new Date(row.timestamp); // Convert MySQL TIMESTAMP to JavaScript Date
							timestamp.setHours(timestamp.getHours() + 6);

							timeSeries[name] = timeSeries[name] ? timeSeries[name] : [];
							timeSeries[name].push({
								value: JSON.parse(row.value),
								timestamp
							});
						});

						// Get key and value of each object in timeSeries
						const highcharts = Object.entries(timeSeries).map(([key, value]) => ({
							name: key,
							data: value.map(({value, timestamp}) => ([timestamp, value]))
						}));

						connection.end();
						resolve(highcharts);
					}
				});
			}
		});
	});
}	

/**
 * Stops the MySQL connection.
 * 
 * @returns {Promise<void>} A promise that resolves when the connection is successfully closed, or rejects with an error if the connection could not be closed.
 */
async function stop(){
	return;
		const c = connect();
		c.end((err) => {
			if (err) {
				throw(err);
			}
		});
}

module.exports = {
	brewData,
	getBrewData,
	setBrewname,
	start,
	stop
}
