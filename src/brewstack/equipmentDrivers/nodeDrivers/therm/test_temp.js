/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const temp = require("./temp.js");
const opt = {sim:{simulate:false}};
temp.start(opt).then(()=>{
  console.log("started");
  temp,getStatus().then(console.log);
})
.then(temp.stop)
.catch(console.error);
