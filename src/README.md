# Source Code Directory Documentation

## Overview
The `src/` directory contains the core application logic, hardware interfaces, and service implementations for the BrewNode server.

## Core Components

### 🔄 `broker.js` - Event Broker System
**Architecture:** Publisher-Subscriber pattern for real-time communication

**Key Functions:**
- `attach(socket)` - Register new Socket.IO client
- `detach(socket)` - Remove client connection
- `create(sensorName)` - Create event publisher for sensor
- `exists(socket)` - Check if socket is already registered
- `setEmitFn(emitFunction)` - Set global emit function

**Usage Pattern:**
```javascript
// Create sensor publisher
const tempPublisher = broker.create('temperature');

// Publish data
tempPublisher({ value: 20.5, timestamp: Date.now() });

// Listen for events
broker.on('temperature', (data) => {
  console.log('Temperature:', data.value);
});
```

### 🚀 `start-stop.js` - Application Lifecycle Manager
**Primary Responsibility:** Coordinate service initialization and shutdown

**Key Functions:**
- `start()` - Initialize all brewing services in correct order
- `stop()` - Graceful shutdown with cleanup
- Service dependency resolution
- Error handling during startup

**Initialization Sequence:**
1. Load environment configuration
2. Initialize database connections
3. Start hardware services
4. Begin sensor monitoring
5. Enable real-time streaming

### 🌡️ Temperature Monitoring System

#### `probes.js` - Temperature Probe Abstraction
**Purpose:** Environment-aware probe selection
```javascript
// Automatically selects DS18B20 or DS18X20 based on availability
module.exports = require('./probes-ds18x20');
```

#### `probes-ds18b20.js` - DS18B20 Sensor Interface
**Hardware:** OneWire digital temperature sensors
**Features:**
- Multi-sensor support (up to 127 sensors on one bus)
- 12-bit resolution (0.0625°C precision)
- Temperature rounding utilities

**Probe Configuration:**
```javascript
module.exports = [
  { name: 'mash_temp', id: '28-0000000000000001' },
  { name: 'boil_temp', id: '28-0000000000000002' },
  { name: 'ferment_temp', id: '28-0000000000000003' }
];
```

#### `probes-ds18x20.js` - Extended Sensor Family Support
**Hardware:** DS18X20 series temperature sensors
**Advantages:**
- Broader sensor compatibility
- Enhanced error handling
- Improved performance monitoring

### ⚡ `pwm.js` - Pulse Width Modulation Controller
**Applications:**
- Electric heating element control
- Pump speed regulation
- Variable fan speed control

**Key Functions:**
- `pwm(mark_ms, space_ms)` - Generate PWM signal with specified duty cycle
- Precise timing control for brewing processes

**Usage Example:**
```javascript
const { pwm } = require('./pwm');

// 50% duty cycle (1000ms on, 1000ms off)
pwm(1000, 1000);
```

### 📱 Tilt Hydrometer Integration (Future Feature)
**Hardware:** Bluetooth Low Energy gravity sensors
**Status:** Currently not implemented
**Planned Functionality:**
- Real-time gravity readings
- Temperature compensation  
- Battery level monitoring
- Multiple color support (Red, Green, Blue, etc.)

## Service Architecture

### Hardware Services (`services/` subdirectory)

#### Temperature Management
- **`temp-service.js`** - Central temperature coordination
- **`temp-controller-service.js`** - PID control algorithms
- **`temp-service-ds18b20.js`** - DS18B20 specific implementation
- **`temp-service-ds18x20.js`** - DS18X20 specific implementation

#### I2C Device Control
- **`i2c_raspi-service.js`** - Raspberry Pi I2C interface
- **`i2c-set.js`** - Device configuration and setup

#### Brewing Equipment
- **`kettle-heater-service.js`** - Heating element control with safety limits
- **`pump-service.js`** - Pump operation with flow monitoring
- **`valve-service.js`** - Automated valve positioning
- **`fan-service.js`** - Cooling system management

#### Glycol System
- **`glycol-service.js`** - Main glycol system coordinator
- **`glycol-chiller-service.js`** - Chilling system control
- **`glycol-heater-service.js`** - Heating system integration

#### Process Monitoring
- **`flow-service.js`** - Flow rate measurement and control
- **`fill-service.js`** - Automated tank filling operations
- **`wdog-service.js`** - System health monitoring

#### External Integrations
- **`brewfather-service.js`** - Brewfather API client
- **`mysql-service.js`** - Database abstraction layer

## Simulation System (`sim/` subdirectory)

### `sim.js` - Main Simulation Engine
**Purpose:** Enable development and testing without physical hardware

**Key Features:**
- Virtual hardware state management
- Realistic sensor behavior simulation
- Configurable failure scenarios
- Performance testing capabilities

**Functions:**
- `simStateReset()` - Initialize simulation state
- `change(item)` - Simulate hardware state changes
- Virtual brewing process modeling

### Hardware Simulators
- **`ds18b20.js`** - Temperature sensor simulation with realistic variation
- **`ds18x20.js`** - Extended sensor family simulation
- **`raspi-i2c.js`** - I2C communication simulation

## Advanced Brewing Framework

### `brewstack/` - Brewing Algorithm Framework

#### `brewingAlgorithms/`
**Purpose:** Advanced brewing calculation and control algorithms
- Mash temperature step control
- Fermentation profile management
- Hop addition timing optimization
- Carbonation level calculations

#### `common/`
**Purpose:** Shared brewing utilities
- Unit conversion functions (Celsius/Fahrenheit, SG/Plato)
- Recipe scaling algorithms
- Brewing constant definitions
- Mathematical helper functions

## Service Integration Patterns

### Event-Driven Architecture
Services communicate through the broker system:
```javascript
// Service publishes data
broker.create('pump-status')({ running: true, flow: 5.2 });

// Other services can subscribe
broker.on('pump-status', (data) => {
  if (data.running) {
    // Adjust temperature control
  }
});
```

### Hardware Abstraction
Services provide consistent interfaces regardless of hardware:
```javascript
// Same interface for real hardware or simulation
const tempService = require('./services/temp-service');
const temperature = await tempService.read('mash_temp');
```

### Error Handling
Robust error handling with graceful degradation:
- Hardware failures fall back to simulation
- Network issues trigger local caching
- Critical errors initiate safe shutdown procedures

## Development Guidelines

### Adding New Services
1. Create service file in appropriate subdirectory
2. Implement standard service interface
3. Add simulation equivalent
4. Register with start-stop lifecycle manager
5. Add broker event publishing
6. Include comprehensive error handling

### Testing Strategy
- Unit tests for individual services
- Integration tests for service communication
- Hardware simulation for CI/CD
- Performance testing with realistic loads

### Performance Considerations
- Sensor polling intervals optimized for brewing timescales
- Memory usage monitoring for long-running processes
- Efficient data structures for historical data
- Background processing for non-critical operations
