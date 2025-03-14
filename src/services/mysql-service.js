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

async function doublePublish(publish, prev, next){
	const dateTimeInMs = new Date().getTime();
	
	await publish(prev, dateTimeInMs);
	await publish(next, dateTimeInMs + 1);
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

function deSanitizeBrewName(sanitizedBrewName) {
	let original = sanitizedBrewName.replace(/_/g, ' ');
	return original.trim();
}

// Removed duplicate setBrewname function

function connect(){
	return new Promise((resolve, reject) => {
		const foo = {
			host     : process.env.DB_HOST,
			user     : process.env.DB_USER,
			password : process.env.DB_PASSWORD,
			database : process.env.DB_NAME
		};

		const connection = mysql.createConnection(foo);
		connection.on('error', async (err) => {
			console.error('MySQL error:', err.code);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				//
			} else {
				// throw err;
			}
		});
		connection.on('timeout', async (err) => {
			console.error('MySQL timeout:', err);
		});

		connection.connect((err) => {
			if (err) {
				if (err.code === "ER_HOST_IS_BLOCKED") {
					connection.query('FLUSH HOSTS', (flushErr) => {
						if (flushErr) {
							reject(flushErr);
						} else {
							reject(err);
						}
					});
				} else {
					reject(err);
				}
				reject(err);
			}else{
				resolve(connection);
			}
		});

	
	});
}

async function log(msg){
	const mysqlDatetime = new Date().toISOString().slice(0, 23).replace('T', ' ');
	try{
		await brewData("log", msg, mysqlDatetime);
	}catch(err){
		console.error(`Failed to log to mysql`, err);
	}
}

/**
 * Inserts a name and value into the current session's table in the MySQL database.
 * 
 * @param {string} name - The name to be inserted.
 * @param {any} value - The value to be inserted, which will be stringified.
 * @returns {Promise} - A promise that resolves if the insertion is successful or if certain conditions are met, and rejects if there is an error during the query execution.
 */
async function brewData(name, value, timestamp){
	const tablename = getSession();
	if (tablename === undefined || name.includes("Flow") || name.includes("log") || name.includes("Watchdog")){
		return;
	}

	const query = `INSERT INTO ${tablename} (name, value, timestamp) VALUES (?, ?, ?)`;
	const values = [name, JSON.stringify(value), timestamp];
	
	try {
		const connection = await connect();
		connection.on('error', (err) => {
			console.error('MySQL error:', err.code);
			if (err.code === 'PROTOCOL_CONNECTION_LOST') {
				connect(); // Reconnect on connection loss
			} else {
				console.error(err);
				return;
			}
		});

		connection.query(query, values, function (error, results, fields) {
			connection.end();
			if (error) {
				console.error(err);
				return;
			}else{
				return results;
			}
		});
	} catch (err) {
		console.error(err);
		return;
	}

}

function getBrewData(name, since = '1970-01-01 00:00:00') {
	const TIME_ZONE_OFFSET = 0;
	return new Promise((resolve, reject) => {
		const tablename = sanitizeBrewName(name);

		// const query = `SELECT * FROM ${tablename} WHERE timestamp > ? ORDER BY timestamp DESC`;
		const query = `SELECT * FROM ${tablename} WHERE timestamp > ? ORDER BY id ASC`;
		const values = [since];
		
		connect().then(connection => {
			if (connection != undefined){
				connection.query(query, values, function (error, results, fields) {
					if (error) {
						reject(error);
					}else{
						// Transform the results into a series of arrays
						const timeSeries = [];
						let latestTimestamp = null;
						results.forEach(row => {
							const name = row.name;
							const timestamp = new Date(row.timestamp); // Convert MySQL TIMESTAMP to JavaScript Date
							timestamp.setHours(timestamp.getHours() + TIME_ZONE_OFFSET);

							timeSeries[name] = timeSeries[name] ? timeSeries[name] : [];
							timeSeries[name].push({
								value: JSON.parse(row.value),
								timestamp
							});

							if (!latestTimestamp || timestamp > latestTimestamp) {
								latestTimestamp = timestamp;
							}
						});

						// Get key and value of each object in timeSeries
						const highcharts = Object.entries(timeSeries).map(([key, value]) => ({
							name: key,
							data: value.map(({value, timestamp}) => ([timestamp, value]))
						}));

						connection.end();
						resolve({ highcharts, latestTimestamp });
					}
				});
			}
		});
	});
}

function setBrewname(name){
	return new Promise(async (resolve, reject) => {
		const connection = await connect();
		if (connection){
			const brewname = sanitizeBrewName(name);

			setSession(brewname);
			
			const tableName = getSession();

			const createTableQuery = `CREATE TABLE IF NOT EXISTS ${tableName} (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255) NOT NULL, value JSON NOT NULL, timestamp TIMESTAMP)`;
			connection.query(createTableQuery, (err, results) => {
				if (err){
					reject(err.message);
				}else{
					connection.end();
					resolve(results);		
				}
			});
		}else{
			connection.end();			
			reject("Can't set brewname, no connection");
		}
	});
}

function getBrewname(){
	return new Promise(async (resolve, reject) => {
		const connection = await connect();
		if (connection){
			const tableName = getSession();
			const brewname = deSanitizeBrewName(tableName);
			connection.end();
			resolve(brewname);		
		}else{
			connection.end();			
			reject("Can't get brewname, no connection");
		}
	});
}


function mysqlBrewnames(){
	return new Promise((resolve, reject) => {

		const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()`;
        const values = [];
        
        connect().then(connection => {
            if (connection != undefined){
                connection.query(query, values, function (error, results, fields) {
                    if (error) {
                        reject(error);
                    }else{
                        // Transform the results into an array of table names
                        const tableNames = results.map(row => row.table_name);
                        resolve(tableNames);
                    }
                });
            } else {
                reject(new Error('Connection is undefined'));
            }
        }).catch(error => {
            reject(error);
        });
	});
}



module.exports = {
	mysqlBrewnames,
	brewData,
	doublePublish,
	getBrewData,
	getBrewname,
	log,
	setBrewname,
}
