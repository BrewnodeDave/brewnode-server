'use strict';

var utils = require('../utils/writer.js');
var Brewnode = require('../service/BrewnodeService');

module.exports.boil = function boil (req, res, next, mins) {
  Brewnode.boil(mins)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.chill = function chill (req, res, next, profile) {
  Brewnode.chill(profile)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.ferment = function ferment (req, res, next, profile) {
  Brewnode.ferment(profile)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.fill = function fill (req, res, next, litres) {
  Brewnode.fill(litres)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getBrewname = function getBrewname (req, res, next) {
  Brewnode.getBrewname()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getInventory = function getInventory (req, res, next) {
  Brewnode.getInventory()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getReadings = function getReadings (req, res, next, batchId) {
  Brewnode.getReadings(batchId)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.getStatus = function getStatus (req, res, next) {
  Brewnode.getStatus()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.k2f = function k2f (req, res, next, flowTimeoutSecs) {
  Brewnode.k2f(flowTimeoutSecs)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.k2m = function k2m (req, res, next, flowTimeoutSecs) {
  Brewnode.k2m(flowTimeoutSecs)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.kettleTemp = function kettleTemp (req, res, next, temp, mins) {
  Brewnode.kettleTemp(temp, mins)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.m2k = function m2k (req, res, next, flowTimeoutSecs) {
  Brewnode.m2k(flowTimeoutSecs)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.restart = function restart (req, res, next) {
  Brewnode.restart()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
