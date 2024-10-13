'use strict';

const root = 'https://api.brewfather.app/v2';

const dotenv = require('dotenv');
dotenv.config();//Adds contents of .env to environ vars e.g. process.env.DB_PASS

const auth = { 
  username : process.env.BREWFATHER_USERNAME, 
  password : process.env.BREWFATHER_PASSWORD
}

module.exports = {
  auth,
  root
}