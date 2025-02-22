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
    const fermenterT = await therm.getTemp("TempFermenter");
    const glycolT = await therm.getTemp("TempGlycol");
    const ambientT = await therm.getTemp("TempAmbient");

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
        "ext_temp": ambient,
    });
    return post(data);
}

module.exports = {
    start: async () => {
        brewlog.info("brewfather-service", "Start");
        const mins15  = 15 * 60 * 1000;
        timer = setInterval(() => getFermenterTemp(mins15));
        return;
    },
    stop: () => {
        brewlog.info("brewfather-service", "Stop");
        clearInterval(timer);
    }
}






