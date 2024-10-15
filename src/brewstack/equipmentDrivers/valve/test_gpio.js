/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const Gpio = require('onoff').Gpio;
		
//Reserved 2,3,4,7,8
//GPIO.2=I2C.SDA, GPIO.3=I2C.SCL, GPIO.4=TEMP
//GPIO.7=ScaleData GPIO.8=ScaleClk
//display inputs every 1/2 second
//testInputs();
//VALID PINS: 5,6,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27
//var Pi2Pins=[20,21, 6,5, 11,25, 9,10, 24,23, 22,27, 18,17, 15,14];
//not working: 6,5,10
//pullup on 15?
const Pi2Pins=[20,21, 26,19, 16,13, 12,25, 24,23, 22,27, 17,18, 10,9];
//testOutputs();
pollInputs();

function pollInputs(){
	const pins = [];
	
	Pi2Pins.forEach(pin => {
		pins.push(new Gpio(pin, 'in', 'both'));		
	});	
	
	setInterval(() => {
		let result = "";
		console.log("===============================================");
		console.log("1o,1c 2o,2c 3o,3c 4o,4c 5o,5c 6o,6c 7o,7c 8o,8c");
		console.log("===============================================");
		let pinId=0;
		pins.forEach(pin => {
			const n=Math.trunc(pinId/2);
					
			result += `${pin.readSync()},`;
			if ((pinId%2)===1)result += "  ";
		
			pinId++;
		});
		console.log(result);
	}, 1000);
}

function testInputs(){
	var pins = [];
	Pi2Pins.forEach(pin => {
		pins.push(new Gpio(pin, 'in', 'both'));
	});
	pins.forEach(input => {
		input.unexport();
	});
	var pins = [];
	PiPins.forEach(pin => {
		pins.push(new Gpio(pin, 'in', 'both'));
	});
	
	console.log("====================================");
	//console.log("27,25,22,18,17,15,14,11,10, 9, 8, 7");
	console.log("5, 6, 13,19,26,29,21,16,12");
	console.log("====================================");
	
	let result = " ";
	pins.forEach(input => {
		result += `${input.readSync()}  `;
	});
	console.log(result);
	
	pins.forEach(input => {
		input.unexport();
	});
}

function testOutputs(){
	var pins = [];
	Pi2Pins.forEach(pin => {
		pins.push(new Gpio(pin, 'out'));
	});
	pins.forEach(pin => {
		pin.unexport();
	});
	var pins = [];
	Pi2Pins.forEach(pin => {
		pins.push(new Gpio(pin, 'out'));
	});
	console.log("====================================");
	//console.log("27,25,22,18,17,15,14,11,10, 9, 8, 7");
	console.log("5, 6, 13,19,26,29,21,16,12");
	console.log("====================================");
		
	const result = " ";
	pins.forEach(output => {
		output.write(0, err => {
			if (err){
				console.log(err);
			}else{
				console.log("ok");/*
				output.write(0, function(err,result){
					if (err){
						console.log(err);
					}else{
						console.log(result);
					}
				});*/
			}
		});
for(let i=0;i<99;i++);console.log('.');
		output.writeSync(1);
	});
	console.log(result);
	
	pins.forEach(pin => {
		pin.unexport();
	});
}

/*
var prevOpen = open.readSync();
var thisOpen;
var prevClose = close.readSync();
var thisClose;
//check that inputs are pulled up
while (1){
		thisOpen = open.readSync();
		if (thisOpen !== prevOpen){
			console.log("Error");
		}
		prevOpen = thisOpen;
		
		thisClose = close.readSync();
		if (thisClose !== prevClose){
			console.log("Error Close");
		}
		prevClose = thisClose;
} 
*/
