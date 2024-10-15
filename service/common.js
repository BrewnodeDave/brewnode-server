/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const axios = require("axios");

const root = 'https://api.brewfather.app/v2';


const dotenv = require('dotenv');
dotenv.config();//Adds contents of .env to environ vars e.g. process.env.DB_PASS


/**
 * Extracts authentication credentials from the request headers.
 * If the 'authorization' header is not present, it returns default credentials from environment variables.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.headers - The headers of the HTTP request.
 * @param {string} [req.headers.authorization] - The authorization header containing base64 encoded credentials.
 * @returns {Object} An object containing the username and password.
 */
function getAuth(req){
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return { 
      username : process.env.BREWFATHER_USERNAME, 
      password : process.env.BREWFATHER_PASSWORD
    };
  }else{
    const auth = authHeader.split(' ')[1];
    const credentials = Buffer.from(auth, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    return { username, password };
  }
}

/**
 * @param {string} endpoint
 * @param {{ include: any; complete?: any; status?: any; limit?: any; start_after?: any; order_by?: any; order_by_direction?: any; id?: any; }} params
 */
async function get(req, endpoint, params){
  try {
      const config = { params, auth:getAuth(req) }
      const response =  await axios.get(`${root}/${endpoint}`, config);
      return response.data;
  } catch (error) {
      console.error(error);
  }
}

async function patch(req, endpoint, params){
  try {
      const config = { params, auth: getReq(req) };
      const response = await axios.patch(`${root}/${endpoint}`, config);
      return response.data;
  } catch (error) {
      console.error(error);
  }
}

module.exports = {
  getAuth,
  get,
  patch,
  root
}