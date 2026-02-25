# Temperature Monitor

Continuous temperature monitoring utility for BrewNode - monitors 4 temperature sensors and logs all measurements to a CSV file.

## Features

- 🌡️ Continuous monitoring of 4 temperature sensors
- 📊 CSV logging of all measurements
- 📈 ASCII and HTML graph generation from log files
- ⚡ Heat exchanger power calculation using LMTD method
- 🔬 Hardware support (DS18X20) and simulation mode
- 📝 Automatic log file creation
- ⏱️ Configurable sampling interval
- 🛑 Graceful shutdown with Ctrl+C

## Monitored Sensors

- **Temp Kettle** - Kettle heating system (ID: 28-00000751bbce) - **Hot Inlet**
- **Temp Glycol** - Glycol system temperature (ID: 28-000007519802) - **Hot Outlet**
- **Temp UniTank** - UniTank fermentation vessel (ID: 28-0000071f5017) - **Cold Inlet**
- **Temp Mash** - Mash/Cold storage temperature (ID: 28-0000069be682) - **Cold Outlet**

### Heat Exchanger Configuration

These 4 sensors monitor a **counterflow heat exchanger**:
- **Hot Side**: Temp Kettle (inlet) → Temp Glycol (outlet)
- **Cold Side**: Temp UniTank (inlet) → Temp Mash (outlet)

The system automatically calculates heat transfer power using the LMTD (Log Mean Temperature Difference) method.

## Installation

```bash
cd temp-monitor
npm install
```

## Usage

### Quick Start

```bash
# Start monitoring (requires hardware with OneWire enabled)
npm start

# Test mode with simulated sensors
npm run start:sim

# Diagnose hardware issues
npm run diagnose

# Clear all log data and start fresh
npm run clean
```

### As a CLI Tool

```bash
# Start with default settings (5 second interval)
npm start

# Test mode with simulated sensors
npm run start:sim

# Generate graphs from logged data
npm run graph
npm run graph:html

# Heat exchanger calculator
npm run heat

# Using the CLI directly
./bin/temp-monitor.js

# Show help and available commands
./bin/temp-monitor.js --help

# Clear log files (start fresh)
./bin/temp-monitor.js --clean
```

### Troubleshooting

```bash
# Run comprehensive hardware diagnostics
npm run diagnose

# Shows:
# - Platform detection (Raspberry Pi check)
# - OneWire bus availability
# - GPIO filesystem access
# - I2C bus status
# - Node.js version compatibility
# - DS18x20 module load status
# - Detailed recommendations for fixes
```

### Generate Graphs

```bash
# ASCII graph in terminal (from default log file)
npm run graph

# HTML graph file (interactive in browser)
npm run graph:html

# Custom output
node graph-generator.js --html /tmp/graph.html

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

## Heat Exchanger Power Calculation

The package calculates heat transfer power for the counterflow heat exchanger using the **LMTD (Log Mean Temperature Difference)** method.

### Configuration

**Counterflow Heat Exchanger:**
- **Hot Side**: Temp Kettle (inlet) → Temp Glycol (outlet)
- **Cold Side**: Temp UniTank (inlet) → Temp Mash (outlet)

### LMTD Method

The heat transfer power is calculated as:

```
Q = U × A × LMTD

Where:
  Q    = Heat transfer rate (W)
  U    = Overall heat transfer coefficient (W/m²·K)
  A    = Heat transfer area (m²)
  LMTD = Log Mean Temperature Difference (°C)

LMTD = (ΔT₁ - ΔT₂) / ln(ΔT₁/ΔT₂)
  ΔT₁ = T_hot_in - T_cold_out
  ΔT₂ = T_hot_out - T_cold_in
```

### Usage

**Standalone Calculator:**
```bash
# Calculate power with specific temperatures
node heat-exchanger.js --kettle 80 --glycol 30 --unitank 5 --mash 25

# With custom U-value and area
node heat-exchanger.js --kettle 80 --glycol 30 --unitank 5 --mash 25 --uvalue 600 --area 1.5

# Show help
node heat-exchanger.js --help
```

**Integrated with Monitoring:**
The heat exchanger power is automatically calculated and displayed during monitoring:

```bash
npm run start:sim
```

Output includes:
```
[9:29:13 PM] Temperature readings:
  Temp Kettle          → 80.3°C (raw: 79.89°C)
  Temp Glycol          → 29.2°C (raw: 29.92°C)
  Temp UniTank         → 3.9°C (raw: 5.08°C)
  Temp Mash            → 23.9°C (raw: 24.86°C)
  Heat Exchanger Power → 19.397 kW (19397 W)
  LMTD                 → 38.79°C
  Effectiveness        → 26.2%
```

**Programmatic Access:**
```javascript
const TemperatureMonitor = require('./index.js');

const monitor = new TemperatureMonitor({
  heatExchanger: {
    enabled: true,
    uValue: 500,  // W/m²·K
    area: 1.0     // m²
  }
});

await monitor.start();

// Later, get current power calculation
const power = await monitor.getHeatExchangerPower();
console.log(`Power: ${power.powerKW} kW`);
console.log(`LMTD: ${power.lmtd}°C`);
console.log(`Effectiveness: ${power.effectiveness}%`);
```

### Configuration Options

| Parameter | Default | Description |
|-----------|---------|-------------|
| `enabled` | `true` | Enable/disable heat exchanger calculations |
| `uValue` | `500` | Overall heat transfer coefficient (W/m²·K) |
| `area` | `1.0` | Heat transfer surface area (m²) |

### Typical U-Values

| Heat Exchanger Type | U-Value (W/m²·K) |
|---------------------|------------------|
| Plate heat exchanger (liquid-liquid) | 2500 - 5000 |
| Shell & tube (liquid-liquid) | 500 - 1500 |
| Finned tube (liquid-air) | 25 - 100 |
| Counterflow (brewery application) | 400 - 800 |

### Output Metrics

- **Power** - Heat transfer rate in W, kW, and BTU/hr
- **LMTD** - Log mean temperature difference (°C)
- **Effectiveness** - Heat exchanger efficiency (%)
- **Hot Side Delta** - Temperature drop on hot side (°C)
- **Cold Side Delta** - Temperature rise on cold side (°C)

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
