/*
 * Wrapper for ds18x20 module to provide compatibility with newer Node.js versions
 * Polyfills deprecated os.tmpDir() method
 */

const os = require('os');
const fs = require('fs');

// Polyfill os.tmpDir() if it doesn't exist (removed in Node.js v15+)
if (!os.tmpDir) {
  os.tmpDir = function() {
    return os.tmpdir();
  };
}

// Check if this is a Raspberry Pi and OneWire is available
function checkHardwareRequirements() {
  const issues = [];
  
  // Check for OneWire support
  if (!fs.existsSync('/sys/bus/w1/devices')) {
    issues.push('OneWire bus not found at /sys/bus/w1/devices');
  } else {
    try {
      const devices = fs.readdirSync('/sys/bus/w1/devices');
      const tempSensors = devices.filter(d => d.startsWith('28-'));
      if (tempSensors.length === 0) {
        issues.push('OneWire available but no DS18x20 sensors detected');
      }
    } catch (e) {
      issues.push('Cannot read OneWire devices: ' + e.message);
    }
  }
  
  return issues;
}

// Store diagnostic info for error messages
const diagnostics = checkHardwareRequirements();

// Now require the actual ds18x20 module
try {
  module.exports = require('ds18x20');
} catch (err) {
  // Enhance error with diagnostics
  const message = err.message + '\n\nDiagnostics:\n' + 
    (diagnostics.length > 0 ? diagnostics.map(i => '  • ' + i).join('\n') : '  • Unable to run diagnostics');
  err.message = message;
  throw err;
}

