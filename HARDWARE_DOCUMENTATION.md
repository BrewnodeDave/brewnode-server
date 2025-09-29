# Hardware Integration Documentation

## Overview
BrewNode Server provides comprehensive hardware integration for brewery automation. This documentation covers the hardware interfaces, device drivers, and integration patterns used in the system.

## Hardware Architecture

### Target Platform: Raspberry Pi
- **Primary OS:** Raspberry Pi OS (Debian-based)
- **Node.js Version:** 18.20.5+
- **GPIO Access:** BCM pin numbering
- **I2C Interface:** Hardware I2C bus support
- **OneWire Interface:** GPIO-based OneWire communication

### Fallback: Simulation Mode
When running on non-Raspberry Pi systems, all hardware interfaces fall back to realistic simulations for development and testing.

## Temperature Sensing System

### OneWire Temperature Sensors

#### DS18B20 Digital Temperature Sensor
**Specifications:**
- **Accuracy:** ±0.5°C from -10°C to +85°C
- **Resolution:** 9 to 12 bits (configurable)
- **Interface:** OneWire digital protocol
- **Power:** Parasitic or external power
- **Range:** -55°C to +125°C

**Wiring:**
```
DS18B20    Raspberry Pi
VDD    →   3.3V (Pin 1)
GND    →   Ground (Pin 6)
DQ     →   GPIO4 (Pin 7) + 4.7kΩ pullup to 3.3V
```

**Implementation:**
```javascript
// probes-ds18b20.js
const sensors = [
  { name: 'mash_temp', id: '28-000000000001', pin: 4 },
  { name: 'boil_temp', id: '28-000000000002', pin: 4 },
  { name: 'ferment_temp', id: '28-000000000003', pin: 4 }
];
```

#### DS18X20 Sensor Family
Extended support for DS1820, DS1822, and DS18S20 sensors with similar interface but different characteristics.

### Temperature Service Architecture

#### Service Hierarchy
1. **temp-service.js** - Central coordinator
2. **temp-controller-service.js** - PID control algorithms
3. **Hardware-specific services** - Device drivers

#### PID Temperature Control
```javascript
// PID parameters for brewing applications
const pidConfig = {
  kp: 2.0,    // Proportional gain
  ki: 0.1,    // Integral gain  
  kd: 0.05,   // Derivative gain
  outputMin: 0,
  outputMax: 100
};
```

## I2C Device Integration

### AB Electronics I2C Boards
The system integrates with AB Electronics expansion boards for additional I/O capabilities.

#### Supported Boards

##### ADC Pi - Analog to Digital Converter
- **Resolution:** 18-bit
- **Channels:** 8 differential/16 single-ended
- **Sample Rate:** 3.75 SPS to 860 SPS
- **Applications:** Pressure sensors, flow meters, pH probes

##### IO Pi - Digital I/O Expander
- **Channels:** 32 digital I/O pins
- **Voltage:** 5V tolerant inputs
- **Current:** 25mA per pin
- **Applications:** Valve control, pump switching, status LEDs

##### Expander Pi - Multi-function Board
- **ADC:** 8-channel 12-bit
- **DAC:** 2-channel 12-bit
- **Digital I/O:** 16 pins
- **RTC:** Real-time clock with battery backup

### I2C Service Implementation
```javascript
// i2c_raspi-service.js
const i2c = require('raspi-i2c').I2C;
const bus = new i2c();

// Read from I2C device
function readDevice(address, register) {
  return bus.readByteSync(address, register);
}
```

## Pulse Width Modulation (PWM)

### Electric Heating Element Control
PWM control for precise heating element management:

```javascript
// pwm.js implementation
function pwm(mark_ms, space_ms) {
  const dutyCycle = mark_ms / (mark_ms + space_ms);
  // Hardware PWM output implementation
}
```

### Applications
- **Mash Heating:** Precise temperature control during mashing
- **Boil Control:** Maintain rolling boil without scorching
- **Fermentation:** Heating pad control for temperature stability

## Pump and Valve Control

### Pump Management
```javascript
// pump-service.js
class PumpService {
  async start(pumpId, flowRate) {
    // Start pump with specified flow rate
  }
  
  async stop(pumpId) {
    // Stop pump with safety checks
  }
  
  getStatus(pumpId) {
    // Return current pump status and flow rate
  }
}
```

### Valve Positioning
```javascript
// valve-service.js
class ValveService {
  async setPosition(valveId, position) {
    // Set valve to specific position (0-100%)
  }
  
  async close(valveId) {
    // Fully close valve
  }
  
  async open(valveId) {
    // Fully open valve
  }
}
```

## Glycol Cooling System

### System Architecture
The glycol system provides precise temperature control for fermentation:

#### Components
- **Chiller Unit:** Compressor-based cooling
- **Glycol Pump:** Circulates glycol solution
- **Heat Exchanger:** Transfers heat from fermenter
- **Temperature Sensors:** Monitor glycol and product temperatures

#### Control Logic
```javascript
// glycol-service.js
class GlycolService {
  async setTargetTemp(fermenter, temperature) {
    // Set target temperature for specific fermenter
  }
  
  async startCooling(fermenter) {
    // Begin cooling cycle
  }
  
  getSystemStatus() {
    // Return overall system status
  }
}
```

## Bluetooth Low Energy Integration

### Tilt Hydrometer Support
Real-time gravity and temperature monitoring via Bluetooth:

```javascript
// tilt.js
const Bleacon = require('bleacon');

Bleacon.on('discover', function(bleacon) {
  const tiltData = parseTiltData(bleacon);
  broker.create('tilt-data')(tiltData);
});
```

### Tilt Data Format
```javascript
{
  color: 'Red',           // Tilt color identifier
  gravity: 1.045,         // Specific gravity
  temperature: 68.5,      // Temperature in Fahrenheit
  battery: 85,            // Battery percentage
  rssi: -45,             // Signal strength
  timestamp: Date.now()   // Reading timestamp
}
```

## Flow Measurement

### Turbine Flow Sensors
Integration with turbine-style flow sensors for volume measurement:

#### Specifications
- **Accuracy:** ±2% of reading
- **Flow Range:** 0.5-30 L/min (typical)
- **Output:** Digital pulse train
- **Calibration:** Pulses per liter (configurable)

#### Implementation
```javascript
// flow-service.js
class FlowService {
  calibrateSensor(sensorId, pulsesPerLiter) {
    // Set calibration factor for sensor
  }
  
  getTotalVolume(sensorId) {
    // Return total volume passed through sensor
  }
  
  getCurrentFlow(sensorId) {
    // Return instantaneous flow rate
  }
}
```

## Safety and Monitoring

### Watchdog Service
System health monitoring with automatic recovery:

```javascript
// wdog-service.js
class WatchdogService {
  monitorTemperature() {
    // Check for dangerous temperature conditions
  }
  
  checkSystemHealth() {
    // Verify all critical services are running
  }
  
  emergencyShutdown() {
    // Safe shutdown in case of critical failure
  }
}
```

### Safety Limits
- **Maximum Temperature:** 110°C (configurable)
- **Minimum Temperature:** -5°C (freeze protection)
- **Maximum Flow Rate:** Based on pump specifications
- **Pressure Limits:** Configurable per system component

## Simulation System

### Development Without Hardware
The simulation system provides realistic behavior for development:

#### Simulated Components
- **Temperature Sensors:** Realistic thermal behavior
- **I2C Devices:** Virtual device responses  
- **Pumps and Valves:** State simulation
- **Flow Sensors:** Calculated flow based on pump settings

#### Configuration
```javascript
// sim/sim.js
const simConfig = {
  temperatureVariation: 0.5,  // ±0.5°C random variation
  thermalInertia: 300,        // 5-minute thermal time constant
  flowAccuracy: 0.98,         // 2% flow measurement error
  sensorFailureRate: 0.001    // 0.1% chance of sensor failure
};
```

## Hardware Troubleshooting

### Common Issues

#### OneWire Sensors Not Detected
1. Check 4.7kΩ pullup resistor
2. Verify GPIO4 is not used by other services
3. Enable OneWire in `/boot/config.txt`: `dtoverlay=w1-gpio`
4. Check sensor power supply (3.3V)

#### I2C Communication Failures
1. Enable I2C: `sudo raspi-config`
2. Check SDA/SCL connections (GPIO2/GPIO3)
3. Verify pullup resistors (usually internal)
4. Test with `i2cdetect -y 1`

#### PWM Output Issues
1. Verify GPIO pin configuration
2. Check for conflicting services (audio, SPI)
3. Ensure adequate power supply for loads
4. Test with multimeter or oscilloscope

### Diagnostic Tools

#### Hardware Test Endpoints
```bash
# Test temperature sensors
GET /hardware/temperature/test

# Test I2C devices  
GET /hardware/i2c/scan

# Test PWM outputs
POST /hardware/pwm/test
```

#### Log Analysis
```bash
# View hardware logs
tail -f /var/log/brewnode/hardware.log

# Check I2C errors
dmesg | grep i2c

# Monitor GPIO usage
cat /sys/kernel/debug/gpio
```

## Performance Optimization

### Polling Intervals
Optimized for brewing time scales:
- **Temperature:** 5-second intervals
- **Flow Rate:** 1-second intervals  
- **Pressure:** 2-second intervals
- **pH:** 30-second intervals

### Resource Management
- **CPU Usage:** <10% on Raspberry Pi 4
- **Memory Usage:** <100MB for all services
- **I2C Bus Speed:** 100kHz (standard mode)
- **GPIO Switching:** <1ms response time
