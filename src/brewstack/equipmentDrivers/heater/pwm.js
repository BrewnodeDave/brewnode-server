/**
 * Pulse Width Modulator
 * @module pwm
 * @desc Periodically call two functions representing Mark and Space timings
 */

 let timeout;
let mark_fn;
let space_fn;
let interval_fn;

/**
 * Periodically call two functions representing Mark and Space timings
 * @param {Number} mark_ms
 * @param {Number} space_ms
 */
function pwm(mark_ms, space_ms){
	if (timeout) {clearTimeout(timeout);}
 
	if (mark_ms > 0){
		mark_fn();
	}
	timeout = setTimeout(() => {
		if (space_ms > 0){
			space_fn();
		}
	}, mark_ms);
}

module.exports = {
	/** Update the mark and space periods */
	restart(mark_ms, space_ms) {
		if (interval_fn) {
			clearInterval(interval_fn); 
			interval_fn = null;
		}
 		pwm(mark_ms, space_ms);
	
		interval_fn = setInterval(() => {
			pwm(mark_ms, space_ms);
		}, mark_ms + space_ms);
	},

 	stop() {
  		clearTimeout(timeout);
		timeout = null;
  		if (interval_fn) {
			clearInterval(interval_fn); 
			interval_fn = null;
		}
 	},

	/**
	 * Initially define both mark and space functions
	 */
 	init(mark, space) {
		mark_fn = mark;
		space_fn = space;
	}
}
