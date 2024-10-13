//Take array of functions that each return a promise
//https://hackernoon.com/functional-javascript-resolving-promises-sequentially-7aac18c4431e
const promiseSerial = funcs =>
  funcs.reduce((promise, f) =>
    promise.then(result => f().then(Array.prototype.concat.bind(result))),
    Promise.resolve([]))


const ftpClient = require('ftp-client');
module.exports = {
  sourceCode(config){
    return new Promise((resolve, reject) => {
        config.port = Number(config.port)
      const client = new ftpClient(config, {logging: 'debug'});
      client.connect(() => {
        console.log("connected");
        
        const patterns = [`pi-docs/**`];
        client.upload(patterns, ".", {overwrite: 'older'}, resolve);
      });
    })
  },

  promiseSerial
}


