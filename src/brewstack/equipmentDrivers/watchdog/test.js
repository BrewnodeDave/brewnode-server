const wdog = require('./wdog.js');

wdog.start(opt).then((opt) => {
	wdog.setDebug(true);
});