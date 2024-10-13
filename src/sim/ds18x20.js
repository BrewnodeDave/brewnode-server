let probes = require('../brewstack/nodeDrivers/therm/probes.js');

let listOfDeviceIds = [];

probes.forEach(({id}) => {
    listOfDeviceIds.push(id);
});

module.exports = { 	
	isDriverLoaded(cb) {
        let err = false;
        let isLoaded = true;
        cb(err, isLoaded);
    },
    list(cb) {
        let err = false;
        cb(err, listOfDeviceIds);
    },
    getAll(cb) {
        let err = false;
        let result = [];
        probes.forEach(({id, prevValue}) => {
            result[id] = prevValue;
        });
        cb(err, result);
    },
    get(probeId, cb) {
        let err = false;
        let temp = null;
        probes.forEach(({id, prevValue}) => {
            if (id === probeId){
                temp = prevValue;
            }
        });
        if (temp === null){
            console.log("Failed to find simulated temp by id=", probeId);
        }
        cb(err, temp);
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
        let temp = Math.trunc(t*100)/100;
        probes.forEach(probe => {
            if (probe.name === name){
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
            probe.prevValue = temp;
            probe.publishTemp(temp);
        });
 	}
}

