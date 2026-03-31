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

const brewlog = require("../brewstack/common/brewlog.js");
const therm = require("./temp-service.js");
const mysqlService = require("./mysql-service.js");
    

let timer = null;

async function getFermenterTemp() {
    const fermenterT = await therm.getTemp("Temp Fermenter");
    const glycolT = await therm.getTemp("Temp Glycol");
    const ambientT = await therm.getTemp("Temp Ambient");

    try {
        await logTemps(fermenterT, ambientT, glycolT);
    } catch (err) {
        // Network errors (ENOTFOUND etc.) are already logged in post() — don't rethrow
        // so the setInterval continues running on the next tick.
    }
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
    logTemps
}






