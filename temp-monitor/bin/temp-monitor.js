#!/usr/bin/env node

/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const TemperatureMonitor = require('../TemperatureMonitor.js');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let interval = 10000; // default 10 seconds
let logPath = null;
let simulate = process.env.SIMULATE === '1';

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--interval' && args[i + 1]) {
    interval = parseInt(args[i + 1]) * 1000;
    i++;
  } else if (args[i] === '--log' && args[i + 1]) {
    logPath = args[i + 1];
    i++;
  } else if (args[i] === '--simulate') {
    simulate = true;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
Temperature Monitor - BrewNode Continuous Temperature Monitoring

Usage: temp-monitor [options]

Options:
  --interval N       Sampling interval in seconds (default: 10)
  --log PATH         Path to log file (default: ./logs/temperatures.csv)
  --simulate         Use simulated sensors (for testing)
  --help, -h         Show this help message

Examples:
  temp-monitor                                      # Start with defaults
  temp-monitor --interval 5 --log /tmp/temps.csv  # Custom interval and log
  temp-monitor --simulate                          # Test mode without hardware
    `);
    process.exit(0);
  }
}

// Create and start monitor
const monitor = new TemperatureMonitor({
  interval,
  logFilePath: logPath,
  simulate
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

// Start monitoring
monitor.start().catch(err => {
  console.error('Failed to start monitor:', err.message);
  process.exit(1);
});
