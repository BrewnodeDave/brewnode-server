/**
 * Setup for Raspberry Pi Hardware Tests
 * 
 * This file sets up the test environment for Pi hardware testing,
 * including hardware checks, permissions, and safety measures.
 */

const fs = require('fs');
const brewdefs = require('../../src/brewstack/common/brewdefs.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

// Global test setup for Pi hardware
beforeAll(async () => {
  console.log('\n🍺 BrewNode Pi Hardware Test Setup');
  console.log('=====================================');
  
  // Verify we're running on Pi hardware
  if (!brewdefs.isRaspPi()) {
    console.log('⚠️  Not running on Raspberry Pi - hardware tests will be skipped');
    return;
  }
  
  console.log('✅ Raspberry Pi hardware detected');
  console.log(`📊 Platform: ${process.platform} (${process.arch})`);
  
  // Check system information
  try {
    const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    const piModel = cpuInfo.match(/Model\s*:\s*(.+)/);
    if (piModel) {
      console.log(`🔧 Hardware: ${piModel[1].trim()}`);
    }
  } catch (error) {
    console.log('⚠️  Could not read CPU info');
  }
  
  // Check OS information
  try {
    const osRelease = fs.readFileSync('/etc/os-release', 'utf8');
    const prettyName = osRelease.match(/PRETTY_NAME="(.+)"/);
    if (prettyName) {
      console.log(`💿 OS: ${prettyName[1]}`);
    }
  } catch (error) {
    console.log('⚠️  Could not read OS info');
  }
  
  // Verify hardware interfaces are available
  await checkHardwareInterfaces();
  
  // Set up hardware test safety measures
  setupHardwareSafety();
  
  console.log('🚀 Pi hardware test environment ready\n');
});

// Global test cleanup
afterAll(async () => {
  if (!brewdefs.isRaspPi()) return;
  
  console.log('\n🧹 Cleaning up Pi hardware test environment...');
  
  // Ensure all hardware is in safe state
  await cleanupHardwareState();
  
  console.log('✅ Pi hardware cleanup complete\n');
});

/**
 * Check that all required hardware interfaces are available
 */
async function checkHardwareInterfaces() {
  const checks = [];
  
  // Check GPIO interface
  checks.push(checkGPIOInterface());
  
  // Check I2C interface  
  checks.push(checkI2CInterface());
  
  // Check OneWire interface
  checks.push(checkOneWireInterface());
  
  // Check permissions
  checks.push(checkPermissions());
  
  const results = await Promise.allSettled(checks);
  
  results.forEach((result, index) => {
    const checkNames = ['GPIO', 'I2C', 'OneWire', 'Permissions'];
    if (result.status === 'fulfilled') {
      console.log(`✅ ${checkNames[index]}: ${result.value}`);
    } else {
      console.log(`⚠️  ${checkNames[index]}: ${result.reason}`);
    }
  });
}

/**
 * Check GPIO interface availability
 */
function checkGPIOInterface() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync('/sys/class/gpio')) {
      if (fs.existsSync('/sys/class/gpio/export')) {
        resolve('Available');
      } else {
        reject('Export not accessible');
      }
    } else {
      reject('Not available');
    }
  });
}

/**
 * Check I2C interface availability
 */
function checkI2CInterface() {
  return new Promise((resolve, reject) => {
    const i2cDevices = ['/dev/i2c-0', '/dev/i2c-1'];
    const available = i2cDevices.filter(device => fs.existsSync(device));
    
    if (available.length > 0) {
      resolve(`Available (${available.join(', ')})`);
    } else {
      reject('No I2C devices found');
    }
  });
}

/**
 * Check OneWire interface availability
 */
function checkOneWireInterface() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync('/sys/bus/w1')) {
      if (fs.existsSync('/sys/bus/w1/devices')) {
        const devices = fs.readdirSync('/sys/bus/w1/devices')
          .filter(device => device.startsWith('28-')); // DS18B20 sensors
        resolve(`Available (${devices.length} sensors found)`);
      } else {
        resolve('Available (no devices)');
      }
    } else {
      reject('Not available - enable w1-gpio overlay');
    }
  });
}

/**
 * Check user permissions for hardware access
 */
function checkPermissions() {
  return new Promise((resolve, reject) => {
    const { spawn } = require('child_process');
    
    // Check if user is in gpio and i2c groups
    const groups = spawn('groups', []);
    let groupsOutput = '';
    
    groups.stdout.on('data', (data) => {
      groupsOutput += data.toString();
    });
    
    groups.on('close', (code) => {
      const userGroups = groupsOutput.trim().split(' ');
      const hasGpio = userGroups.includes('gpio');
      const hasI2c = userGroups.includes('i2c');
      
      if (hasGpio && hasI2c) {
        resolve('GPIO and I2C access available');
      } else {
        const missing = [];
        if (!hasGpio) missing.push('gpio');
        if (!hasI2c) missing.push('i2c');
        reject(`Missing groups: ${missing.join(', ')}`);
      }
    });
    
    groups.on('error', () => {
      reject('Could not check groups');
    });
  });
}

/**
 * Set up hardware safety measures for testing
 */
function setupHardwareSafety() {
  // Set hardware operation timeouts
  global.HARDWARE_TIMEOUT = 5000; // 5 second timeout for hardware ops
  
  // Set up emergency cleanup on process signals
  process.on('SIGINT', emergencyCleanup);
  process.on('SIGTERM', emergencyCleanup);
  process.on('uncaughtException', (error) => {
    console.error('Uncaught exception during Pi tests:', error);
    emergencyCleanup();
    process.exit(1);
  });
  
  // Set hardware operation limits
  global.MAX_CONCURRENT_OPERATIONS = 3;
  global.operationCount = 0;
}

/**
 * Emergency cleanup function
 */
async function emergencyCleanup() {
  console.log('\n⚠️  Emergency hardware cleanup...');
  
  try {
    // Try to stop all services quickly
    const services = ['pump-service', 'valve-service', 'temp-service'];
    
    for (const serviceName of services) {
      try {
        const service = require(`../../src/services/${serviceName}.js`);
        if (service && typeof service.stop === 'function') {
          await Promise.race([
            service.stop(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), 1000)
            )
          ]);
        }
      } catch (error) {
        // Ignore individual service errors during emergency cleanup
      }
    }
    
    console.log('✅ Emergency cleanup complete');
  } catch (error) {
    console.error('❌ Emergency cleanup failed:', error.message);
  }
}

/**
 * Clean up hardware state after all tests
 */
async function cleanupHardwareState() {
  try {
    // Ensure all pumps are off
    const pumpService = require('../../src/services/pump-service.js');
    if (pumpService.isStarted && pumpService.isStarted()) {
      await pumpService.stop();
    }
    
    // Ensure all valves are closed
    const valveService = require('../../src/services/valve-service.js');
    if (valveService.isStarted && valveService.isStarted()) {
      await valveService.stop();
    }
    
    // Stop temperature monitoring
    const tempService = require('../../src/services/temp-service.js');
    if (tempService.isStarted && tempService.isStarted()) {
      await tempService.stop();
    }
    
    console.log('✅ All hardware services stopped');
    
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error.message);
  }
}

// Export utility functions for tests
module.exports = {
  checkHardwareInterfaces,
  setupHardwareSafety,
  emergencyCleanup,
  cleanupHardwareState
};