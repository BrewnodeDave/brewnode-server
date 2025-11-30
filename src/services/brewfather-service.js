/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */


const {post} = require('../../controllers/brewfather-stream.js');

const dotenv = require('dotenv');
dotenv.config();//Adds contents of .env to environ vars e.g. process.env.DB_PASS

const axios = require('axios');
const brewlog = require("../brewstack/common/brewlog.js");
const therm = require("./temp-service.js");
const mysqlService = require("./mysql-service.js");

const brewfatherV2 = 'https://api.brewfather.app/v2';
    

let timer = null;

async function getFermenterTemp() {
    const fermenterT = await therm.getTemp("Temp Fermenter");
    const glycolT = await therm.getTemp("Temp Glycol");
    const ambientT = await therm.getTemp("Temp Ambient");

    await logTemps(fermenterT, ambientT, glycolT);
}


/**
 * Logs temperature data to Brewfather.
 *
 * @param {number} fermenter - The temperature of the fermenter.
 * @param {number} ambient - The ambient temperature.
 * @param {number} glycol - The temperature of the glycol.
 * @returns {Promise} - A promise that resolves when the data is posted.
 */
function logTemps(fermenter, ambient, glycol) {
    const brewname = mysqlService.getBrewname();

    const data = JSON.stringify({
        "name": process.env.BREWFATHER_STREAM_NAME, // Required field, this will be the ID in Brewfather
        "temp": fermenter, //Ferment Temp
        "aux_temp": glycol, //Fridge Temp
        "comment": "Brewnode",
        "beer": brewname,
        "ext_temp": ambient,//Room Temp,
        "report_source": "Brewnode"
    });
    return post(data);
}

/**
 * Fetches the current recipe from Brewfather.
 * First looks for batches with status 'Brewing', then 'Fermenting' if none found.
 *
 * @returns {Promise<Object>} - The recipe of the current brewing batch.
 * @throws {Error} - If no brews are in progress or if there's an error fetching the data.
 */
async function currentRecipe() {
    const auth = {
        username: process.env.BREWFATHER_USERNAME,
        password: process.env.BREWFATHER_PASSWORD
    };

    const params = {
        "complete": true,
        "status": 'Brewing',
    };

    const config = { params, auth };
    
    const response = await axios.get(`${brewfatherV2}/batches`, config);
    const numBrewing = response.data.length;
    
    if (numBrewing === 0) {
        // Try Fermenting status if no Brewing batches found
        const fermentingParams = {
            "complete": true,
            "status": 'Fermenting'
        };
        const fermentingConfig = { params: fermentingParams, auth };
        const fermentingResponse = await axios.get(`${brewfatherV2}/batches`, fermentingConfig);
        const numFermenting = fermentingResponse.data.length;
        
        if (numFermenting === 0) {
            throw new Error("No brews in progress!");
        } else if (numFermenting > 1) {
            throw new Error("Multiple brews in progress!");
        }
        
        const batch = fermentingResponse.data[0];
        return { ...batch.recipe, name: `${batch.recipe.name}-${batch.batchNo}` };
    } else if (numBrewing === 1) {
        const batch = response.data[0];
        return { ...batch.recipe, name: `${batch.recipe.name}-${batch.batchNo}` };
    } else {
        throw new Error("Multiple brews in progress!");
    }
}

module.exports = {
    start: (intervalMinutes = 15) => {
        brewlog.info("brewfather-service", "Start");
        
        // Clear existing timer if any
        if (timer !== null) {
            clearInterval(timer);
        }
        
        const intervalMs = intervalMinutes * 60 * 1000;
        timer = setInterval(() => getFermenterTemp(), intervalMs);
        return;
    },
    stop: () => {
        brewlog.warn("brewfather-service", "Stop");
        if (timer !== null) {
            clearInterval(timer);
            timer = null;
        }
    },

    getFermenterTemp,
    logTemps,
    currentRecipe
}






