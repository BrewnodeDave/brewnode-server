/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

let probes = require('../probes.js');

let listOfDeviceIds = [];

probes.forEach(({id}) => {
    listOfDeviceIds.push(id);
});

const sensors = probes.reduce((prev,curr) => {
    prev[curr.id] = 9.9;
    return prev;
},[]);

module.exports = { 	
    read_sensor: (pin, fahrenheit, callback) => {
        callback(sensors);
    },
    read_one_sensor: (pin, id, fahrenheit, callback) => {
        callback(sensors[id]);
    },
    list_sensor: (pin) => {
        return probes.map(probe => [probe.id]).flat();
    },
    
    /**
     * Need a way to get the temp by name for simulation
     */
    getByName(name) {
        let err = false;
        let temp = null;
        probes.forEach(probe => {
            if (probe.name === name){
                temp = probe.prevValue;
            }
        });
        
        if (temp === null){
            console.log("Failed to find simulated temp by name=", name);
        }
        return temp;
    },
    
    /**
     * Need a way to set the temp for simulation
     */
    set(name, t) {
        probes.forEach(probe => {
            if (probe.name === name){
                const temp = probe.compensate(t);
                if (probe.prevValue != temp){
                    probe.prevValue = temp;
                    probe.publishTemp(temp);
                }
                return;
            }
        });
     },
     setAll(temp) {
        probes.forEach(probe => {
            const compensated = probe.compensate(temp);
            probe.prevValue = compensated;
            probe.publishTemp(compensated);
        });
 	}
}

