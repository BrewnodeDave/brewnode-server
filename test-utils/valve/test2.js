const valve = require('./valve.js');
const valves = valve.valves;

const opened=(n, value) => {
  console.log(`opened valve ${n}=${value}`);
  if (n != 0){
	  valves[n-1].open();
  }	  
};
const closed=(n, value) => {
  console.log(`closed valve ${n}=${value}`);
  if (n != 0){
	  valves[n-1].close();
  }};
const error=value => {	
  console.log("error=",value);
  process.exit(1);
};

valves.forEach((v, id) => {
	v.on(valve.EVENT.OPENED, value => {
		opened(id, value);
	});
	v.on(valve.EVENT.CLOSED, value => {
		closed(id, value);
	});
	v.on(valve.EVENT.ERROR, error);
});

if (process.argv.length !== 4){
    console.log ("test2.js 1(open)/0(close) valveid\n")
}else{
  const startValve = process.argv[3];
  if (process.argv[2] == 1){   
    valves[startValve].open();
  }else{
    valves[startValve].close();	
  }
}




