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

### Hardware Configuration
The BrewNode system uses the Raspberry Pi's hardware I2C bus with dual MCP23017 GPIO expanders for comprehensive brewery automation control.

**Physical I2C Connections:**
- **Pin 3 (SDA)** - I2C Data Line  
- **Pin 5 (SCL)** - I2C Clock Line
- **Bus Speed:** 100kHz standard mode
- **Voltage:** 5V logic levels

**I2C Expansion Boards:**
- **Chip 0x20** - Primary MCP23017 expander (bits 0-15)
- **Chip 0x21** - Secondary MCP23017 expander (bits 16-31)
- **Total Capacity:** 32 digital I/O pins

### Complete I2C Pin Mapping

#### 🚰 Pump Control (3 devices)
| Bit | Chip | Pin | Device | Purpose | Service |
|-----|------|-----|--------|---------|---------|
| **0** | 0x20 | 8 | **Glycol Pump** | Cooling system circulation | `pump-service.js` |
| **8** | 0x20 | 3 | **Kettle Pump** | Wort transfer from kettle | `pump-service.js` |
| **9** | 0x20 | 11 | **Mash Pump** | Mash recirculation | `pump-service.js` |

#### 🚪 Valve Control (4 devices)
| Bit | Chip | Pin | Device | Purpose | Service |
|-----|------|-----|--------|---------|---------|
| **1** | 0x20 | 9 | **Fermenter Valve In** | Chiller wort output | `valve-service.js` |
| **2** | 0x20 | 10 | **Chill Wort Valve In** | Chiller wort input | `valve-service.js` |
| **5** | 0x20 | 5 | **Kettle Valve In** | Kettle input control | `valve-service.js` |
| **6** | 0x20 | 6 | **Mash In Valve** | Mash input control | `valve-service.js` |

#### 🔥 Heating Elements (2 devices)
| Bit | Chip | Pin | Device | Purpose | Service |
|-----|------|-----|--------|---------|---------|
| **11** | 0x20 | 11 | **Glycol Heater** | Glycol temperature control | `glycol-heater-service.js` |
| **17** | 0x21 | 22 | **Kettle Heater** | Main heating element (3000W) | `kettle-heater-service.js` |

#### 💨 Cooling & Control (7 devices)
| Bit | Chip | Pin | Device | Purpose | Service |
|-----|------|-----|--------|---------|---------|
| **10** | 0x20 | 13 | **Fan** | Cooling system fan | `fan-service.js` |
| **3** | 0x20 | 11 | **Switch 4** | General purpose | `i2c_raspi-service.js` |
| **4** | 0x20 | 12 | **Switch 5** | General purpose | `i2c_raspi-service.js` |
| **12** | 0x20 | 6 | **Relay 4** | General control | `i2c_raspi-service.js` |
| **13** | 0x20 | 13 | **Glycol Power** | System power control | `glycol-service.js` |
| **14** | 0x20 | 14 | **Relay 2** | General control | `i2c_raspi-service.js` |
| **15** | 0x20 | 15 | **Relay 1** | General control | `i2c_raspi-service.js` |

#### 📊 Monitoring & Status (2 devices)
| Bit | Chip | Pin | Device | Purpose | Service |
|-----|------|-----|--------|---------|---------|
| **16** | 0x21 | 22 | **Watchdog LED** | System status indicator | `i2c_raspi-service.js` |
| **7** | 0x20 | 15 | **Fermenter Pump** | Secondary pump control | `pump-service.js` |

#### 📈 Flow Sensors (Currently Disabled)
| Bit | Chip | Pin | Device | Purpose | Status |
|-----|------|-----|--------|---------|--------|
| **24** | 0x21 | 24 | Flow Sensor 0 | Kettle flow monitoring | Commented out |
| **25** | 0x21 | 25 | Flow Sensor 1 | Mash flow monitoring | Commented out |
| **27** | 0x21 | 27 | Flow Sensor 3 | Ferment flow monitoring | Commented out |

### I2C Service Implementation

**Core Service Module:** `src/services/i2c_raspi-service.js`

```javascript
// MCP23017 Register Addresses
const REGx20 = 0x20;  // Primary expansion chip
const REGx21 = 0x21;  // Secondary expansion chip

// Direction Control (1=input, 0=output)
const DIR_INPUT = 1;
const DIR_OUTPUT = 0;

// Initialize I2C service
const i2c = require('raspi-i2c').I2C;
const bus = new i2c();

// Write a single bit
function writeBit(bit, value) {
  if (bit < 16) {
    if (bit < 8) {
      // Write to REGx20, register 0x12 (bits 0-7)
      writeReg(REGx20, 0x12, dataByte[0], bit, value);
    } else {
      // Write to REGx20, register 0x13 (bits 8-15)
      writeReg(REGx20, 0x13, dataByte[1], bit - 8, value);
    }
  } else {
    if (bit < 24) {
      // Write to REGx21, register 0x12 (bits 16-23)
      writeReg(REGx21, 0x12, dataByte[2], bit - 16, value);
    } else {
      // Write to REGx21, register 0x13 (bits 24-31)
      writeReg(REGx21, 0x13, dataByte[3], bit - 24, value);
    }
  }
}
```

**Usage Examples:**

```javascript
// Turn on glycol pump (bit 0)
i2c.writeBit(0, 1);

// Open kettle valve (bit 5)
i2c.writeBit(5, 0);  // 0 = open, 1 = close

// Read watchdog status (bit 16)
const status = i2c.readBit(16);
```

### Device Usage Summary

**Active I2C Devices:** 18 out of 32 available pins
- **Pumps:** 4 devices (bits 0, 7, 8, 9)
- **Valves:** 4 devices (bits 1, 2, 5, 6) 
- **Heaters:** 2 devices (bits 11, 17)
- **Control:** 7 devices (bits 3, 4, 10, 12-15)
- **Monitoring:** 1 device (bit 16)

**Available for Expansion:** 14 unused pins for future brewery automation features

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
// Tilt integration (future feature)
// Requires: npm install bleacon
// Implementation available upon request
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

#### Automated Hardware Tests
Comprehensive test suite for validating Pi hardware integration:

**Pi Hardware Test Suite** (`tests/hardware/pi-hardware.test.js`):
- **22 automated tests** covering all hardware interfaces
- **Automatic platform detection** - skips on non-Pi systems
- **Safe hardware validation** - includes safety checks
- **Real hardware testing** - validates actual GPIO/I2C/OneWire interfaces

**Test Categories:**
1. **Platform Detection** - Raspberry Pi environment validation
2. **GPIO Service** - Digital I/O and PWM functionality
3. **Temperature Services** - DS18B20 and DS18X20 sensors
4. **I2C Interface** - MCP23017 GPIO expander communication
5. **Service Integration** - Multi-service coordination tests
6. **Flow Control** - Pump and valve operations
7. **Temperature Control** - Heating/cooling system validation
8. **Safety Systems** - Watchdog and failsafe mechanisms

**Running Pi Tests:**
```bash
# Run Pi hardware tests (skips on non-Pi)
npm run test:pi

# Run with coverage report
npm run test:pi:coverage

# Run in watch mode for development
npm run test:pi:watch

# Run specific test category
npm test -- --testPathPattern=pi-hardware --testNamePattern="GPIO"
```

**Test Configuration:**
- Extended timeouts for hardware operations (10s default, 30s for complex tests)
- Automatic environment validation before test execution
- Hardware safety checks to prevent damage
- Comprehensive error reporting for debugging

See `tests/hardware/README.md` for detailed test documentation.

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
