#!/usr/bin/env node

/*
 * Beerware License
 * ----------------
 * As long as you retain this notice, you can do whatever you want with 
 * this stuff. If we meet someday, and you think this stuff is worth it, 
 * you can buy me a beer in return.
 */

const fs = require('fs');
const path = require('path');
const TemperatureMonitor = require('./TemperatureMonitor.js');

/**
 * Clear log files and reset monitoring data
 */
function clearLogs() {
  const logsDir = path.join(process.cwd(), 'logs');
  try {
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true });
      console.log('✅ Log files cleared successfully');
      console.log(`📁 Logs directory removed: ${logsDir}`);
    } else {
      console.log('ℹ️  No log files found to clear');
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Error clearing logs:', err.message);
    process.exit(1);
  }
}

/**
 * Show help information
 */
function showHelp() {
  console.log(`
Temperature Monitor - Usage

Commands:
  npm start              Start monitoring with real sensors
  npm run start:sim      Start monitoring with simulation mode
  npm run graph          Generate ASCII temperature graph
  npm run graph:html     Generate HTML temperature graph
  npm run heat           Run heat exchanger calculator
  npm run diagnose       Run hardware diagnostics
  npm run clean          Clear all log data and reset

Options:
  SIMULATE=1 npm start   Enable simulation mode

Examples:
  npm start                              # Start real monitoring
  SIMULATE=1 npm start                   # Start simulation
  npm run graph                          # Show graph of logged data
  npm run clean                          # Clear all log files
  `);
  process.exit(0);
}

// If run as a script, start monitoring
if (require.main === module) {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
  }

  // Check for clean/reset flag
  if (args.includes('--clean') || args.includes('--reset') || args.includes('--clear')) {
    clearLogs();
  }

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
    console.error('\n💡 Troubleshooting tips:');
    console.error('   • Run diagnostics: npm run diagnose');
    console.error('   • Test with simulation: SIMULATE=1 npm start');
    console.error('   • Check OneWire is enabled on Raspberry Pi');
    console.error('   • Verify sensor connections and power supply\n');
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
