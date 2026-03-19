const brewlog = require('./brewlog.js');

const reportSecs = 60;
const secs2mins = secs => Math.ceil((secs / 60));

module.exports = (delaySecs, cb =() => {}) => new Promise((resolve, reject) => {
   let toGoSecs = delaySecs;
 
   const report =  setInterval(() => {
	   toGoSecs -= reportSecs;	
      cb(`${secs2mins(toGoSecs)} mins to go.`);
   }, reportSecs*1000);

   setTimeout(() => {
       clearInterval(report);
       resolve();
    }, delaySecs*1000);
})
