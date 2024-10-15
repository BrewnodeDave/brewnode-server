/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const brewlog = require('../../brewlog.js');
const broker = require('../../broker.js');

function findPhase(name){
    let result = {
        id:undefined,
        info:undefined
    }

    if (name === undefined){
        return {
            id: phases.length-1,
            info: phases[phases.length-1]
        }
    }

    let id = 0;
    phases.forEach(phase => {
        if (phase.name === name){
            result.id = id;
            result.info = phase;
        }
        id++;
    });
    return result;
}

let phases = [];

const publishStatus = broker.create("brewstatus");

function phaseBegin(name, min, max) {
    return new Promise((resolve, reject) => {	
        let phaseInfo = findPhase(name).info;

        if (phaseInfo){
            let reason = `Cant begin ${name} phase. Already in phase ${name}`;
            //brewlog.error(reason);
            brewlog.error(reason);
            resolve();
        }else{
            brewlog.info("phaseBegin",name);

            phaseInfo = {
                name,
                current:min,
                min,
                max
            };   

            phases.push(phaseInfo);

            if (max === undefined) {
                //we dont know how long for
            }
        
            brewlog.info(phaseInfo);
            publishStatus(phaseInfo);

            resolve();
        }
    });
}

function phaseEnd(name) {
    return new Promise((resolve, reject) => {	
        let phase = findPhase(name);

        if (phase.info === undefined) {
        //    console.log("phaseEnd: ooh err, I dont understand this phase name", name);
        }else{
            phase.info.current = phase.info.max;
            brewlog.info(phase.info);
            publishStatus(phase.info);
            phases.splice(phase.id, 1);
        }

        resolve();

    });
}

//If name is undefined use the current phase
function phaseCurrent(name, progress) {
    let phase = findPhase(name);

    if (phase.info === undefined) {
 //       console.log("phaseCurrent: ooh err, I dont understand this phase name", name, progress);
        return;
    }

    if ((progress === phase.info.current) || (progress == undefined)){
        return;
    }
    
    phase.info.current = progress;
    
    brewlog.info(phase.info);
    publishStatus(phase.info);

}

module.exports = {
    begin:      phaseBegin,
    end:        phaseEnd,
    current:    phaseCurrent
}	
