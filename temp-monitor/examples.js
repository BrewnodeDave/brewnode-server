#!/usr/bin/env node

/**
 * Example usage of BrewNode Temperature Monitor
 * 
 * This file demonstrates various ways to use the temperature monitoring system
 */

const TemperatureMonitor = require('./index.js');
const path = require('path');

// Example 1: Basic monitoring with defaults
async function example1_basicMonitoring() {
  console.log('\n=== Example 1: Basic Monitoring ===\n');
  
  const monitor = new TemperatureMonitor({
    simulate: true  // Use simulation mode for this example
  });

  await monitor.start();
  
  // Let it run for 15 seconds
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  monitor.stop();
}

// Example 2: Custom intervals and log location
async function example2_customConfig() {
  console.log('\n=== Example 2: Custom Configuration ===\n');
  
  const monitor = new TemperatureMonitor({
    interval: 3000,  // 3 seconds instead of default 10
    logFilePath: '/tmp/brewery-temps.csv',
    simulate: true
  });

  console.log('Monitor config:', monitor.getStatus());
  
  await monitor.start();
  
  await new Promise(resolve => setTimeout(resolve, 12000));
  
  monitor.stop();
}

// Example 3: Single temperature read without continuous monitoring
async function example3_singleRead() {
  console.log('\n=== Example 3: Single Temperature Read ===\n');
  
  const monitor = new TemperatureMonitor({
    simulate: true
  });

  await monitor.initialize();
  
  const readings = await monitor.readAllTemperatures();
  
  console.log('Current Temperature Readings:');
  readings.forEach(reading => {
    console.log(`  ${reading.name.padEnd(20)} → ${reading.compensatedTemp.toFixed(1)}°C`);
  });
}

// Example 4: Background monitoring with status checking
async function example4_backgroundMonitoring() {
  console.log('\n=== Example 4: Background Monitoring ===\n');
  
  const monitor = new TemperatureMonitor({
    interval: 5000,
    logFilePath: '/tmp/bg-temps.csv',
    simulate: true
  });

  await monitor.start();
  
  // Check status periodically
  const statusChecker = setInterval(() => {
    const status = monitor.getStatus();
    console.log(`Monitor Running: ${status.running}, Monitoring ${status.probeCount} sensors`);
  }, 10000);
  
  // Stop after 25 seconds
  await new Promise(resolve => setTimeout(resolve, 25000));
  
  clearInterval(statusChecker);
  monitor.stop();
}

// Example 5: Integration with application
async function example5_applicationIntegration() {
  console.log('\n=== Example 5: Application Integration ===\n');
  
  const monitor = new TemperatureMonitor({
    interval: 4000,
    logFilePath: '/tmp/app-temps.csv',
    simulate: true
  });

  try {
    await monitor.start();
    
    // Your application logic here
    console.log('Temperature monitoring is running in the background');
    console.log(`Logging to: ${monitor.getStatus().logFilePath}`);
    
    // Simulate some application work
    await new Promise(resolve => setTimeout(resolve, 20000));
    
  } catch (error) {
    console.error('Failed to start monitoring:', error);
  } finally {
    monitor.stop();
  }
}

// Example 6: Error handling
async function example6_errorHandling() {
  console.log('\n=== Example 6: Error Handling ===\n');
  
  const monitor = new TemperatureMonitor({
    simulate: true
  });

  try {
    await monitor.start();
    
    // Simulate an issue
    await new Promise(resolve => setTimeout(resolve, 10000));
    
  } catch (error) {
    console.error('Monitoring error:', error.message);
  } finally {
    if (monitor.getStatus().running) {
      monitor.stop();
    }
  }
}

// Example 7: Multiple monitors (different sensors)
async function example7_multipleMonitors() {
  console.log('\n=== Example 7: Multiple Monitors ===\n');
  
  // Create two monitors with different intervals
  const monitor1 = new TemperatureMonitor({
    interval: 5000,
    logFilePath: '/tmp/temps-fast.csv',
    simulate: true
  });

  const monitor2 = new TemperatureMonitor({
    interval: 15000,
    logFilePath: '/tmp/temps-slow.csv',
    simulate: true
  });

  console.log('Starting dual monitors...');
  await monitor1.start();
  await monitor2.start();
  
  console.log(`Monitor 1 status: ${monitor1.getStatus().interval}ms intervals`);
  console.log(`Monitor 2 status: ${monitor2.getStatus().interval}ms intervals`);
  
  await new Promise(resolve => setTimeout(resolve, 20000));
  
  monitor1.stop();
  monitor2.stop();
  
  console.log('Both monitors stopped');
}

// Main: Run examples
async function main() {
  const examples = [
    { name: '1', fn: example1_basicMonitoring },
    { name: '2', fn: example2_customConfig },
    { name: '3', fn: example3_singleRead },
    { name: '4', fn: example4_backgroundMonitoring },
    { name: '5', fn: example5_applicationIntegration },
    { name: '6', fn: example6_errorHandling },
    { name: '7', fn: example7_multipleMonitors }
  ];

  if (process.argv[2]) {
    // Run specific example
    const exampleNum = process.argv[2];
    const example = examples.find(e => e.name === exampleNum);
    
    if (example) {
      try {
        await example.fn();
      } catch (error) {
        console.error('Example failed:', error);
      }
    } else {
      console.log(`Example ${exampleNum} not found`);
      console.log(`Available examples: ${examples.map(e => e.name).join(', ')}`);
    }
  } else {
    // Show available examples
    console.log('BrewNode Temperature Monitor - Usage Examples\n');
    console.log('Available examples:');
    examples.forEach(ex => {
      console.log(`  node examples.js ${ex.name}`);
    });
    console.log('\nRun a specific example with: node examples.js [number]');
    console.log('\nExamples:');
    console.log('  1 - Basic monitoring');
    console.log('  2 - Custom configuration');
    console.log('  3 - Single temperature read');
    console.log('  4 - Background monitoring with status');
    console.log('  5 - Application integration');
    console.log('  6 - Error handling');
    console.log('  7 - Multiple monitors');
  }
}

main().catch(console.error);
