# BrewNode Temperature Monitor Package

## Overview

The `temp-monitor` package is a Node.js utility for continuous temperature monitoring of 4 temperature sensors in the BrewNode system. It automatically logs all measurements to a CSV file with timestamps, raw values, and compensated values.

## Package Contents

```
temp-monitor/
├── bin/
│   └── temp-monitor.js           # CLI executable entry point
├── TemperatureMonitor.js          # Main monitoring class
├── probes.js                      # Sensor definitions (4 sensors)
├── sim-ds18x20.js                 # Simulated sensor driver for testing
├── index.js                       # Module export
├── package.json                   # Package metadata
├── README.md                      # Usage guide
├── LICENSE                        # License information
└── INSTALLATION.md                # This file
```

## Monitored Temperature Sensors

The package monitors exactly 4 temperature sensors from the existing BrewNode infrastructure:

1. **Temp Glycol** (28-000007519802)
   - Purpose: Glycol system temperature monitoring
   - Compensation: y = x × 1.0235 - 1.5093

2. **Temp Kettle** (28-00000751bbce)
   - Purpose: Kettle heating system
   - Compensation: y = x × 1.0235 - 1.5093

3. **Temp UniTank** (28-0000071f5017)
   - Purpose: UniTank fermentation vessel
   - Compensation: y = x × 1.0205 - 1.3231

4. **Temp SS** (28-0000006a79e8)
   - Purpose: Stainless steel vessel
   - Compensation: y = x × 1.0205 - 1.3231

## Installation

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- For hardware: Raspberry Pi with OneWire GPIO support

### Install Steps

```bash
# Navigate to the package directory
cd /path/to/brewnode-server/temp-monitor

# Install dependencies
npm install
```

### Optional: Install ds18x20 Driver

For real hardware support:

```bash
npm install ds18x20
```

For simulation mode (no hardware required):

```bash
# No additional dependencies needed
# Use --simulate flag or set SIMULATE=1
```

## Quick Start

### 1. Test with Simulation Mode

```bash
cd temp-monitor
npm run start:sim
```

This will display temperature readings every 10 seconds and log to `logs/temperatures.csv`.

### 2. Start Monitoring with Defaults

```bash
npm start
```

Requires hardware sensors connected.

### 3. Custom Configuration

```bash
./bin/temp-monitor.js --interval 5 --log /var/log/temps.csv
```

## Usage Modes

### CLI Mode

```bash
# Start with default settings (10 second interval)
./bin/temp-monitor.js

# 5-second interval
./bin/temp-monitor.js --interval 5

# Custom log location
./bin/temp-monitor.js --log /var/log/brewery/temps.csv

# Simulation mode (no hardware)
./bin/temp-monitor.js --simulate

# Combined options
./bin/temp-monitor.js --interval 5 --log /tmp/temps.csv --simulate

# Show help
./bin/temp-monitor.js --help
```

### Node Module Mode

```javascript
const TemperatureMonitor = require('./index.js');

// Create instance
const monitor = new TemperatureMonitor({
  interval: 5000,                          // 5 seconds
  logFilePath: '/var/log/temps.csv',       // Custom log location
  simulate: true                           // Use simulated data
});

// Start monitoring
await monitor.start();

// ... monitoring runs in background ...

// Stop when ready
monitor.stop();

// Get status
const status = monitor.getStatus();
console.log(status);
// Output:
// {
//   running: true,
//   logFilePath: '/var/log/temps.csv',
//   interval: 5000,
//   simulate: true,
//   probeCount: 4
// }
```

## Log File Format

The CSV log file contains detailed measurement records:

### Columns

| Column | Description | Example |
|--------|-------------|---------|
| timestamp | ISO 8601 formatted timestamp | 2026-02-16T20:30:52.677Z |
| sensor_name | Human-readable sensor name | Temp Kettle |
| sensor_id | OneWire device ID | 28-00000751bbce |
| temperature_celsius | Raw sensor reading | 25.54 |
| compensated_temperature | Calibration-adjusted value | 24.6 |

### Example Output

```csv
timestamp,sensor_name,sensor_id,temperature_celsius,compensated_temperature
2026-02-16T20:30:52.677Z,Temp Glycol,28-000007519802,29.17,28.3
2026-02-16T20:30:52.678Z,Temp Kettle,28-00000751bbce,25.54,24.6
2026-02-16T20:30:52.681Z,Temp UniTank,28-0000071f5017,24.26,23.4
2026-02-16T20:30:52.681Z,Temp SS,28-0000006a79e8,27.53,26.8
```

## Operating Modes

### Hardware Mode (Default)

Connects to real DS18X20 temperature sensors:
- Requires OneWire GPIO on Raspberry Pi
- Reads actual temperature values
- Applies calibration compensation
- Provides accurate brewery data

```bash
npm start
```

### Simulation Mode

Uses synthetic temperature data for testing:
- No hardware required
- Generates realistic random variations
- Useful for development and testing
- Enable with `--simulate` or `SIMULATE=1`

```bash
npm run start:sim
```

## Configuration Options

### Runtime Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| interval | number | 10000 | Sampling interval in milliseconds |
| logFilePath | string | ./logs/temperatures.csv | Path to CSV log file |
| simulate | boolean | false | Use simulated sensors |

### Environment Variables

| Variable | Effect |
|----------|--------|
| SIMULATE=1 | Enable simulation mode |
| NODE_ENV=production | Production logging mode |

## Advanced Usage

### Integration with SystemD

Create `/etc/systemd/system/brewnode-temp-monitor.service`:

```ini
[Unit]
Description=BrewNode Temperature Monitor
After=network.target

[Service]
Type=simple
User=brewnode
WorkingDirectory=/home/brewnode/brewnode-server/temp-monitor
ExecStart=/usr/bin/node bin/temp-monitor.js --log /var/log/brewery/temperatures.csv
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable brewnode-temp-monitor
sudo systemctl start brewnode-temp-monitor
```

### Log Rotation

Use `logrotate` to manage log files:

Create `/etc/logrotate.d/brewnode-temps`:

```
/var/log/brewery/temperatures.csv {
  daily
  rotate 7
  compress
  delaycompress
  notifempty
  create 0640 brewnode brewnode
}
```

### Data Analysis

Read and analyze CSV data with Node:

```javascript
const fs = require('fs');
const csv = require('csv-parse');

fs.createReadStream('/var/log/brewery/temperatures.csv')
  .pipe(csv({ columns: true }))
  .on('data', (row) => {
    console.log(`${row.sensor_name}: ${row.compensated_temperature}°C`);
  });
```

## Troubleshooting

### Issue: "Temperature driver not loaded"

**Cause**: DS18X20 module not installed or hardware not connected

**Solution**:
```bash
npm install ds18x20
# or use simulation mode
npm run start:sim
```

### Issue: "Sensor not found"

**Cause**: Sensor ID doesn't match hardware configuration

**Solution**:
1. Update sensor IDs in `probes.js` with your actual hardware IDs
2. Use simulation mode to test: `npm run start:sim`

### Issue: Log file not created

**Cause**: Directory permissions or missing path

**Solution**:
```bash
mkdir -p /var/log/brewery
chmod 777 /var/log/brewery
./bin/temp-monitor.js --log /var/log/brewery/temps.csv
```

### Issue: Readings seem incorrect

**Cause**: Sensor miscalibration

**Solution**:
- Check compensation formulas in `probes.js`
- Verify raw vs. compensated values in log
- Compare with hardware sensor documentation

## Performance Considerations

- **CPU Usage**: Minimal (~1% per monitoring loop)
- **Memory**: ~40-50 MB base usage
- **Disk I/O**: ~1 KB per reading cycle
- **Recommended Interval**: 5-60 seconds (default: 10 seconds)

## File Locations

- **Default Log**: `./logs/temperatures.csv` (in current directory)
- **Custom Log**: Specify with `--log` option
- **Module**: `/temp-monitor/index.js`
- **Executable**: `/temp-monitor/bin/temp-monitor.js`

## API Reference

### TemperatureMonitor Class

#### Constructor

```javascript
new TemperatureMonitor(options)
```

**Parameters**:
- `options.interval` (number): Milliseconds between readings (default: 10000)
- `options.logFilePath` (string): CSV log file path (default: `./logs/temperatures.csv`)
- `options.simulate` (boolean): Use simulated sensors (default: false)

#### Methods

##### `async initialize()`

Initialize and verify the temperature sensor driver.

```javascript
await monitor.initialize();
```

##### `async start()`

Start continuous temperature monitoring.

```javascript
await monitor.start();
```

##### `stop()`

Stop the monitoring loop.

```javascript
monitor.stop();
```

##### `async readAllTemperatures()`

Read all sensor temperatures once.

```javascript
const readings = await monitor.readAllTemperatures();
// Returns: [
//   { name: 'Temp Kettle', id: '28-00000751bbce', rawTemp: 25.54, compensatedTemp: 24.6 },
//   ...
// ]
```

##### `getStatus()`

Get current monitor status.

```javascript
const status = monitor.getStatus();
// Returns: {
//   running: boolean,
//   logFilePath: string,
//   interval: number,
//   simulate: boolean,
//   probeCount: number
// }
```

## Support and Debugging

### Enable Debug Output

```bash
DEBUG=* npm start
```

### Check Sensor Availability

```bash
./bin/temp-monitor.js --simulate --interval 1
```

### Verify Log File

```bash
tail -f logs/temperatures.csv
```

### Test Integration

```javascript
const TemperatureMonitor = require('./index.js');

const monitor = new TemperatureMonitor({ simulate: true });

monitor.start()
  .then(() => {
    setTimeout(() => {
      console.log('Status:', monitor.getStatus());
      monitor.stop();
    }, 15000);
  })
  .catch(console.error);
```

## License

Beerware License - See LICENSE file

## Author

BrewNode Team

## Related Documentation

- `README.md` - Quick start guide
- `../HARDWARE_DOCUMENTATION.md` - Hardware sensor specs
- `../probes-ds18x20.js` - Sensor configuration reference
