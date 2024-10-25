/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const wdog = require('./wdog.js');

wdog.start(opt).then((opt) => {
	wdog.setDebug(true);
});