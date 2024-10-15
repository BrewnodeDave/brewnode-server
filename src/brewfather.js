/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const { isRaspPi } = require("./brewdefs.js");

let axios;
if (isRaspPi()) {
    // axios = require("axios");
}
axios = require("axios");

const dotenv = require('dotenv');
dotenv.config();//Adds contents of .env to environ vars e.g. process.env.DB_PASS


const http = require("http");
const brewlog = require("./brewlog.js");
const therm = require("./brewstack/nodeDrivers/therm/temp.js");

let timer = null;

const auth = { 
    username : process.env.BREWFATHER_USERNAME, 
    password : process.env.BREWFATHER_PASSWORD
}

/**
 * @param {string} endpoint
 * @param {{ status: string; complete: boolean; }} params
 */
async function get(endpoint, params){
    brewlog.info(`https://api.brewfather.app/v2/batches`);
    try {
        const config = { params, auth }
        const response = await axios.get(`https://api.brewfather.app/v2/batches`, config);
        return response.data;
    } catch (error) {
        console.error(error);
    }
}

/**
 * @param {string | any[]} data
 */
function post(data) {
    return new Promise((resolve, reject) => {
    	//console.log("post", data);
    	const options = {
       	 	hostname: "log.brewfather.net",
      	  	path: `/stream?id=${process.env.BREWFATHER_CUSTOM_STREAM}`,
       		method: "POST",
        	headers: {
          		"Content-Type": "application/json",
          		"Content-Length": data.length
       		}
      	};

      	const req = http.request(options, res => {
       	 	//console.log(`statusCode: ${res.statusCode}`)
        	res.on("data", resolve);
      	});

      	req.on("error", reject);

    	req.write(data);
    	req.end();
    });
}

function getFermenterTemp() {
    //console.log("getFermenterTemp...");
    therm.getTemp("TempFermenter")
        .then(fermenterT => {
            therm.getTemp("TempMash")
                .then(ambientT => {
                    therm.getTemp("TempGlycol")
                        .then(glycolT => {
                            logTemps(fermenterT, ambientT, glycolT)
                                .then(brewlog.info);
                        });
                })
        });
}

/*
Field "name" is required. Other fields are optional. At least one value field must be provided (Temp, gravity or pressure, etc).
{
  "name": "YourDeviceName", // Required field, this will be the ID in Brewfather
  "temp": 20.32,
  "aux_temp": 15.61, // Fridge Temp
  "ext_temp": 6.51, // Room Temp
  "temp_unit": "C", // C, F, K
  "gravity": 1.042,
  "gravity_unit": "G", // G, P
  "pressure": 10,
  "pressure_unit": "PSI", // PSI, BAR, KPA
  "ph": 4.12,
  "bpm": 123, // Bubbles Per Minute
  "comment": "Hello World",
  "beer": "Pale Ale",
  "battery": 4.98
}
*/
/**
 * @param {any} temp
 */
function logTemp(temp) {
    //console.log("logTemp",temp);
    const data = JSON.stringify({
        "name": process.env.BREWFATHER_ID, // Required field, this will be the ID in Brewfather
        "temp": temp, //Ferment Temp
        "temp_unit": "C", // C, F, K
        "comment": "Brewnode",
        "beer": recipeName,
        "ext_temp": 9.99,
    });
    return post(data);
}

/**
 * @param {any} fermenter
 * @param {any} ambient
 * @param {any} glycol
 */
function logTemps(fermenter, ambient, glycol) {
    //console.log("logTemp",temp);
    const data = JSON.stringify({
        "name": process.env.BREWFATHER_ID, // Required field, this will be the ID in Brewfather
        "temp": fermenter, //Ferment Temp
        "aux_temp": glycol,
        "temp_unit": "C", // C, F, K
        "comment": "Brewnode",
        "beer": recipeName,
        "ext_temp": ambient,
    });
    return post(data);
}

let recipeName = "";

module.exports = {
    batches: async() => {
        const url = `https://api.brewfather.app/v2/batches`;

        const complete = false;
        const status = undefined;
        let finalId;
        let result = [];
        let batches = [{}];
        let fetching = true;
        // const response = await axios.get(url, {auth});
        while (fetching){
            const params = {complete, status, start_after: finalId, limit:50};
            batches = await get("batches", params);
            fetching = batches.length > 0;
            if (batches.length > 0){
                finalId = batches[batches.length-1]._id;
                const foo = batches
                    .filter(batch => batch.name !== 'Batch')
                    .map(batch => ({name:batch.name, id:batch._id}));
                result = [...result, ...foo];
            }
        }
        return result;

    },
    /**
     * 
     * This endpoint allows you to fetch all readings stored in a batch. If you only need the latest reading use the call above.
            :batch_id is the _id property from the batch JSON.
     */
    batchReadings: async(batchId) => {
        const url = `https://api.brewfather.app/v2/batches/${batchId}/readings`;
        const response = await axios.get(url, {auth});
        return response.data;
    },

    fermentables: async () => {
        const url = `https://api.brewfather.app/v2/inventory/fermentables`;
        const response = await axios.get(url, {auth});
        return response.data.map((/** @type {{ supplier: any; name: any; inventory: any; }} */ x) => ({supplier:x.supplier, name:x.name, inventory:x.inventory}))
    },

    yeasts: async () => {
        const url3 = `https://api.brewfather.app/v2/inventory/yeasts?inventory_exists=true&complete=true&limit=999`;
        const response = await axios.get(url3, {auth});
        return response.data.map((/** @type {{ laboratory: any; name: any; inventory: any; unit: any; }} */ x)=>({laboratory:x.laboratory, name:x.name, inventory:x.inventory, unit:x.unit}));
    },

    hops: async () => {
        const url3 = `https://api.brewfather.app/v2/inventory/hops?inventory_exists=true&complete=true&limit=999`;
        const response = await axios.get(url3, {auth});
        return response.data.map(x=>({type:x.type, name:x.name, inventory:x.inventory, unit:x.unit}));
    },

    miscs: async () => {
        const url4 = `https://api.brewfather.app/v2/inventory/miscs?inventory_exists=true&complete=true&limit=999`;
        const response = await axios.get(url4, {auth});
        return response.data.map(x=>({name:x.name, inventory:x.inventory, unit:x.unit}));
    },

    currentRecipe: async () => {
        /*
            status Valid values "Planning", "Brewing", "Fermenting", "Conditioning", "Completed", "Archived". Defaults to "Planning".
        */
        const batches = await get("batches", { status: 'Brewing', complete: true });
        // const batches = JSON.parse(result);
        if (batches[0]) {
            recipeName = batches[0].recipe.name;
            return batches[0].recipe;
        } else {
            console.error("Failed to find current batch");
            process.exit();
        }
    },

    get,
    logTemp,

    start: (/** @type {any} */ opt) => {
        return new Promise((resolve, reject) => {
            brewlog.info("brewfather.js", "Starting to log ferment temp");
            getFermenterTemp();
            //Post ferment temp every 15 mins
            timer = setInterval(getFermenterTemp, 15 * 60 * 1000);
            resolve(opt);
        });
    },
    stop: () => {
        brewlog.info("brewfather.js", "Stop logging ferment temp");
        clearInterval(timer);
    }
}






