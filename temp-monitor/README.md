# Temperature Monitor

Continuous temperature monitoring utility for BrewNode - monitors 4 temperature sensors and logs all measurements to a CSV file.

## Features

- 🌡️ Continuous monitoring of 4 temperature sensors
- 📊 CSV logging of all measurements
- 📈 ASCII and HTML graph generation from log files
- 🔬 Hardware support (DS18X20) and simulation mode
- 📝 Automatic log file creation
- ⏱️ Configurable sampling interval
- 🛑 Graceful shutdown with Ctrl+C

## Monitored Sensors

- **Temp Glycol** - Glycol system temperature (ID: 28-000007519802)
- **Temp Kettle** - Kettle heating system (ID: 28-00000751bbce)
- **Temp UniTank** - UniTank fermentation vessel (ID: 28-0000071f5017)
- **Temp SS** - Stainless steel vessel (ID: 28-0000006a79e8)

## Installation

```bash
cd temp-monitor
npm install
```

## Usage

### As a CLI Tool

```bash
# Start with default settings (5 second interval)
npm start

# Test mode with simulated sensors
npm run start:sim

# Using the CLI directly
./bin/temp-monitor.js --interval 5 --log /tmp/temps.csv

# Show help
./bin/temp-monitor.js --help
```

### Generate Graphs

```bash
# ASCII graph in terminal (from default log file)
npm run graph

# HTML graph file (interactive in browser)
npm run graph:html

# Custom input and output
node graph-generator.js --input logs/temperatures.csv --html /tmp/graph.html

# Show graph help
node graph-generator.js --help
```

### CLI Options

- `--interval N` - Sampling interval in seconds (default: 10)
- `--log PATH` - Path to log file (default: `./logs/temperatures.csv`)
- `--simulate` - Use simulated sensors for testing
- `--help, -h` - Show help message

### As a Node Module

```javascript
const TemperatureMonitor = require('@brewnode/temp-monitor');

const monitor = new TemperatureMonitor({
  interval: 5000,           // 5 seconds
  logFilePath: './logs/temps.csv',
  simulate: false
});

// Start monitoring
await monitor.start();

// Later, stop monitoring
monitor.stop();

// Get current status
console.log(monitor.getStatus());
```

## Log File Format

The CSV log file contains the following columns:

```
timestamp,sensor_name,sensor_id,temperature_celsius,compensated_temperature
2024-02-16T10:30:45.123Z,Temp Kettle,28-00000751bbce,72.5,72.3
2024-02-16T10:30:55.456Z,Temp Kettle,28-00000751bbce,72.6,72.4
```

### Column Descriptions

- **timestamp** - ISO 8601 formatted timestamp
- **sensor_name** - Human-readable sensor name
- **sensor_id** - OneWire device ID
- **temperature_celsius** - Raw temperature reading
- **compensated_temperature** - Temperature after calibration compensation

## Graph Generation

### ASCII Graphs (Terminal)

Display temperature trends directly in your terminal:

```bash
npm run graph
```

Output example:
```
=================================================================================
Temperature: Temp Kettle
=================================================================================
72.5°C ┌●       ●   ●   ●           ●   ●   ●   ●   ●       ●           ┐
       │ ●     ● ● ● ● ●           ●   ●   ●   ●   ●   ●   ● ●         │
       │  ●   ●   ●   ●   ●       ●   ●   ●   ●   ●   ●       ●        │
       │   ● ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●   ●         │
70.1°C └───────────────────────────────────────────────────────────────┘
       Reading Progress →
```

### HTML Graphs (Interactive)

Generate beautiful interactive charts in HTML:

```bash
npm run graph:html
```

This creates `temperature-graph.html` with:
- Multi-line interactive chart showing all 4 sensors
- Min/Max/Average statistics for each sensor
- Hover tooltips for data points
- Responsive design for desktop and mobile

Open in browser:
```bash
open temperature-graph.html  # macOS
xdg-open temperature-graph.html  # Linux
start temperature-graph.html  # Windows
```

### Custom Graph Options

```bash
# ASCII graph from custom log file
node graph-generator.js --input /var/log/brewery/temps.csv --ascii

# HTML graph to custom location
node graph-generator.js --input logs/temperatures.csv --html /tmp/my-graph.html

# View all options
node graph-generator.js --help
```

## Features

### Automatic Compensation

Each sensor has a calibration compensation formula that corrects raw readings:
- Glycol & Kettle: y = x × 1.0235 - 1.5093
- UniTank & SS: y = x × 1.0205 - 1.3231

### Hardware Support

- **Real Hardware**: Uses `ds18x20` npm package for actual sensor data
- **Simulation Mode**: Built-in simulator for testing without hardware

### Error Handling

- Automatic sensor validation on startup
- Per-sensor error logging without stopping the monitor
- Graceful handling of missing sensors
- Log file creation and recovery

## Examples

### 1. Monitor with 5-second interval

```bash
./bin/temp-monitor.js --interval 5
```

### 2. Test mode with simulated data

```bash
npm run start:sim
```

### 3. Custom log location

```bash
./bin/temp-monitor.js --log /var/log/brewery/temps.csv
```

### 4. As part of a larger Node application

```javascript
const TemperatureMonitor = require('./temp-monitor');

const monitor = new TemperatureMonitor({
  interval: 10000,
  logFilePath: '/var/log/brewery/temperatures.csv'
});

monitor.start().catch(console.error);

// In your event handler or when ready to stop:
process.on('SIGTERM', () => {
  monitor.stop();
  process.exit(0);
});
```

## Directory Structure

```
temp-monitor/
├── bin/
│   └── temp-monitor.js       # CLI executable
├── TemperatureMonitor.js     # Main monitor class
├── probes.js                 # Sensor definitions
├── sim-ds18x20.js            # Simulation driver
├── index.js                  # Module entry point
├── package.json
└── README.md
```

## License

Beerware License - see LICENSE file for details

## Author

BrewNode Team
