const temp = require("./temp.js");
const opt = {sim:{simulate:false}};
temp.start(opt).then(()=>{
  console.log("started");
  temp,getStatus().then(console.log);
})
.then(temp.stop)
.catch(console.error);
