/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

/**
 * Pulse Width Modulator
 * @module pwm
 * @desc Periodically call two functions representing Mark and Space timings
 */

const NanoTimer = require('nanotimer');

const intervalTimer = new NanoTimer();
const timeoutTimer = new NanoTimer();

module.exports = {
	init: (mark, space) => {

console.log("pwm2.init:",mark.name, space.name);
		const mark_fn = mark;
		const space_fn = space;
		let interval_fn = null;
		let timeout = null;

		return {	
			/** Update the mark and space periods */
			restart: (mark_ms, space_ms) => {
				if (interval_fn) {
					intervalTimer.clearInterval(); 
					interval_fn = null;
				}

				mark2space(mark_ms, space_ms);
			
				interval_fn = true;
				intervalTimer.setInterval(() => {
					mark2space(mark_ms, space_ms);
				}, '', `${mark_ms + space_ms}m`);
			},

			stop: () => {
				timeoutTimer.clearTimeout();
				if (interval_fn) {
					intervalTimer.clearInterval(); 
					interval_fn = null;
				}
			}
		}
			
		function mark2space (mark_ms, space_ms) {
console.log({mark_ms},{space_ms});
			if (timeout) {
				timeoutTimer.clearTimeout();
			}
		
			if (mark_ms > 0){
console.log("mark",mark_fn.name);
				mark_fn();
			}
			timeoutTimer.setTimeout(() => {
				if (space_ms > 0){
console.log("space",space_fn.name);
					space_fn();
				}
			}, '', `${mark_ms}m`);
		}
	}
}

