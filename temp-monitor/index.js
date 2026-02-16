#!/usr/bin/env node

/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const TemperatureMonitor = require('./TemperatureMonitor.js');

// If run as a script, start monitoring
if (require.main === module) {
  const monitor = new TemperatureMonitor({
    simulate: process.env.SIMULATE === '1'
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    monitor.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
  });

  monitor.start().catch(err => {
    console.error('Failed to start monitor:', err.message);
    process.exit(1);
  });
}

/**
 * Export for use as a module
 * 
 * Example usage:
 * 
 *   const TemperatureMonitor = require('@brewnode/temp-monitor');
 *   
 *   const monitor = new TemperatureMonitor({
 *     interval: 5000,
 *     logFilePath: '/var/log/brewery/temperatures.csv',
 *     simulate: false
 *   });
 *   
 *   monitor.start().then(() => {
 *     console.log('Monitoring started');
 *   }).catch(err => {
 *     console.error('Start failed:', err);
 *   });
 */

module.exports = TemperatureMonitor;
