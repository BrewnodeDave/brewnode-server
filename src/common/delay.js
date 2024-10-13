const brewlog = require('./brewlog.js');

const reportSecs = 60;
const secs2mins = secs => Math.ceil((secs / 60));

module.exports = (delaySecs, name) => new Promise((resolve, reject) => {
   let toGoSecs = delaySecs;
// console.log(`delay for ${secs2mins(delaySecs)} mins`);
   brewlog.info(`${name} delay for ${secs2mins(delaySecs)} mins`);
 
   const report =  setInterval(() => {
	toGoSecs -= reportSecs;	
      brewlog.info(`${name}:${secs2mins(toGoSecs)} mins to go.`);
   }, reportSecs*1000);

   setTimeout(() => {
       clearInterval(report);
       resolve();
    }, delaySecs*1000);
})
