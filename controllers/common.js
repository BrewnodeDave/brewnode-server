/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const axios = require("axios");

const brewfatherV2 = 'https://api.brewfather.app/v2';

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
  const authHeader = req?.headers?.authorization;
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

const callAxios = f => async (req, endpoint, params) => {
  try {
    const config = { params, auth: getAuth(req) };
    return await f(`${brewfatherV2}/${endpoint}`, config);
  } catch (error) {
    return error;
  }
}

module.exports = {
  getAuth,
  get: callAxios(axios.get),
  patch: callAxios(axios.patch),
  brewfatherV2
}