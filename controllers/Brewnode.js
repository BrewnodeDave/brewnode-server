/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

'use strict';

const utils = require('../utils/writer.js');
const brewnode = require('../service/brewnode.js');


module.exports.boil = function boil (req, res, next, mins) {
  brewnode.boil(mins)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.chill = function chill (req, res, next, profile) {
  brewnode.chill(profile)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.ferment = function ferment (req, res, next, profile) {
  brewnode.ferment(profile)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.fill = function fill (req, res, next, litres) {
  brewnode.fill(litres)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBrewname = function getBrewname (req, res, next) {
  brewnode.getBrewname()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInventory = function getInventory (req, res, next) {
  brewnode.getInventory()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReadings = function getReadings (req, res, next, batchId) {
  brewnode.getReadings(batchId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.k2f = function k2f (req, res, next, flowTimeoutSecs) {
  brewnode.k2f(flowTimeoutSecs)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.k2m = function k2m (req, res, next, flowTimeoutSecs) {
  brewnode.k2m(flowTimeoutSecs)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.kettleTemp = function kettleTemp (req, res, next, temp, mins) {
  brewnode.kettleTemp(temp, mins)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};


module.exports.m2k = function m2k (req, res, next, flowTimeoutSecs) {
  brewnode.m2k(flowTimeoutSecs)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.restart = function restart (req, res, next) {
  brewnode.restart()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};


module.exports.getStatus = function status (req, res, next) {
  brewnode.getStatus()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.mash = function status (req, res, next, steps) {
  brewnode.mash(steps)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
