# BrewNode Server - Complete File Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Configuration Files](#configuration-files)
- [Entry Point](#entry-point)
- [API Specification](#api-specification)
- [Controllers](#controllers)
- [Core Services](#core-services)
- [Hardware Integration](#hardware-integration)
- [Simulation Components](#simulation-components)
- [Third-Party Libraries](#third-party-libraries)
- [Documentation](#documentation)

---

## Project Overview

BrewNode Server is a Node.js backend application designed to run on a Raspberry Pi for brewery monitoring and control. It provides REST APIs, real-time Socket.IO communication, and hardware integration for temperature sensing, valve control, and brewing process automation.

**Key Features:**
- REST API with OpenAPI/Swagger documentation
- Real-time data streaming via Socket.IO
- Brewfather integration
- Temperature monitoring (DS18B20/DS18X20 sensors)
- I2C device control
- Hardware simulation for non-Raspberry Pi environments
- MySQL database integration

---

## Configuration Files

### `package.json`
**Purpose:** NPM package configuration and dependency management
**Key Dependencies:**
- `axios` - HTTP client for external API calls
- `socket.io` - Real-time bidirectional communication
- `oas3-tools` - OpenAPI 3.0 tools for Express
- `mysql` - MySQL database driver
- `cors` - Cross-Origin Resource Sharing middleware
- `dotenv` - Environment variable loader
- `ds18x20` - Temperature sensor library
- `raspi-i2c` - Raspberry Pi I2C interface (optional dependency)

### `commitlint.config.js`
**Purpose:** Git commit message linting configuration
**Contents:** Enforces conventional commit format for better changelog generation

### `.gitignore`
**Purpose:** Specifies files and directories to ignore in version control
**Key Exclusions:** 
- `node_modules/`
- Log files (`*.log`)
- Environment files (`.env`)
- Runtime files (`*.pid`)

---

## Entry Point

### `index.js`
**Purpose:** Main application entry point and server initialization
**Key Responsibilities:**
1. **Express App Setup:** Configures OpenAPI tools with controller routing
2. **CORS Configuration:** Enables cross-origin requests with specific options
3. **HTTP Server:** Creates and starts HTTP server on port 8080
4. **Socket.IO Server:** Initializes WebSocket server on port 4000
5. **Broker Integration:** Connects event broker for real-time data streaming
6. **Service Initialization:** Calls start-stop.js to initialize brewing services

**Server Ports:**
- HTTP API: 8080
- WebSocket: 4000

**Key Middleware:**
- CORS with credential support
- SwaggerRouter for API routing
- Custom middleware insertion handling

---

## API Specification

### `api.yaml`
**Purpose:** OpenAPI 3.0 specification defining the REST API
**Size:** 2,188 lines - comprehensive API documentation
**Key Endpoints:**
- `/mysql/brewnames` - Database brew name retrieval
- `/brewdata` - Brew data fetching with date filtering
- `/brewing` - Brewing process control
- Brewfather proxy endpoints for all Brewfather API operations
- Hardware control endpoints (temperature, valves, pumps, etc.)

**Authentication:** API key and basic authentication for Brewfather integration
**Documentation:** Available at `http://localhost:8080/docs/`

---

## Controllers

All controllers are located in the `controllers/` directory and handle HTTP request routing.

### `brewnode.js`
**Purpose:** Core BrewNode API controller
**Size:** 606+ lines
**Key Functions:**
- Brew data retrieval and filtering
- Brewing process management
- Hardware status monitoring
- Real-time data streaming coordination

### `mysql.js`
**Purpose:** Database operations controller
**Key Functions:**
- Brew name retrieval from MySQL database
- Database connection management
- Data persistence operations

### `common.js`
**Purpose:** Shared utility functions for controllers
**Key Functions:**
- Common response formatting
- Error handling utilities
- Validation helpers

### Brewfather Integration Controllers
**Purpose:** Proxy controllers for Brewfather API integration

#### `brewfather-batches.js`
- Batch management operations
- Batch data retrieval and updates
- Fermentation tracking

#### `brewfather-recipes.js`
- Recipe management
- Recipe data access
- Recipe sharing and importing

#### `brewfather-fermentables.js`
- Fermentable ingredient management
- Grain bill calculations
- Malt and extract handling

#### `brewfather-hops.js`
- Hop variety management
- Hop scheduling and additions
- Bittering, flavor, and aroma calculations

#### `brewfather-miscs.js`
- Miscellaneous ingredient management
- Additives and clarifying agents
- Specialty brewing additions

#### `brewfather-yeasts.js`
- Yeast strain management
- Fermentation parameters
- Yeast calculator integrations

#### `brewfather-stream.js`
**Purpose:** Real-time data streaming to Brewfather
**Key Functions:**
- Live fermentation data upload
- Temperature and gravity streaming
- Automated batch updates

---

## Core Services

All core services are located in the `src/` directory.

### `broker.js`
**Purpose:** Event broker for real-time data distribution
**Key Functions:**
- Socket.IO client management
- Event publishing and subscription
- Real-time data broadcasting
- Client connection handling

**Architecture:** Publisher-subscriber pattern for decoupled real-time communication

### `start-stop.js`
**Purpose:** Application lifecycle management
**Key Functions:**
- `start()` - Initialize all brewing services
- `stop()` - Graceful shutdown of services
- Service dependency management
- Hardware initialization

### Temperature Monitoring

#### `probes.js`
**Purpose:** Temperature probe abstraction layer
**Function:** Selects appropriate probe implementation based on environment

#### `probes-ds18b20.js`
**Purpose:** DS18B20 temperature sensor integration
**Hardware:** OneWire temperature sensors
**Features:**
- Multi-sensor support
- Temperature rounding utilities
- Hardware-specific implementation

#### `probes-ds18x20.js`
**Purpose:** DS18X20 temperature sensor family support
**Hardware:** Extended OneWire temperature sensor family
**Features:** Similar to DS18B20 with broader sensor compatibility

### Hardware Control

#### `pwm.js`
**Purpose:** Pulse Width Modulation control
**Applications:**
- Heater control
- Pump speed regulation
- Variable output devices

**Functions:**
- `pwm(mark_ms, space_ms)` - Generate PWM signals
- Timing-based control algorithms

#### `tilt.js`
**Purpose:** Tilt Hydrometer integration
**Hardware:** Bluetooth-enabled gravity sensors
**Features:**
- Bluetooth Low Energy (BLE) communication
- Gravity and temperature readings
- Real-time fermentation monitoring

---

## Hardware Integration

### Service Layer (`src/services/`)

The services directory contains specialized hardware control modules:

#### Temperature Services
- `temp-service.js` - Main temperature service coordinator
- `temp-service-ds18b20.js` - DS18B20 sensor service
- `temp-service-ds18x20.js` - DS18X20 sensor service
- `temp-controller-service.js` - PID temperature control

#### I2C Device Services
- `i2c_raspi-service.js` - Raspberry Pi I2C interface
- `i2c_raspi-service.test.js` - I2C service unit tests
- `i2c-set.js` - I2C device configuration

#### Brewing Equipment Services
- `kettle-heater-service.js` - Heating element control
- `pump-service.js` - Pump operation management
- `valve-service.js` - Valve positioning control
- `fan-service.js` - Cooling fan management

#### Glycol System Services
- `glycol-service.js` - Main glycol system coordinator
- `glycol-chiller-service.js` - Chilling system control
- `glycol-heater-service.js` - Heating system control

#### Process Services
- `flow-service.js` - Flow rate monitoring
- `fill-service.js` - Tank filling operations
- `wdog-service.js` - Watchdog service for system monitoring

#### External Integrations
- `brewfather-service.js` - Brewfather API client service
- `mysql-service.js` - Database service layer

#### User Interfaces
- `temp.html` - Temperature monitoring web interface
- `beer-survey.html` - Beer quality survey form

---

## Simulation Components

### `src/sim/` Directory
**Purpose:** Hardware simulation for non-Raspberry Pi environments

#### `sim.js`
**Purpose:** Main simulation engine
**Functions:**
- `simStateReset()` - Reset simulation state
- `change(item)` - Simulate hardware state changes
- Virtual hardware behavior modeling

#### `ds18b20.js`
**Purpose:** DS18B20 temperature sensor simulation
**Features:** Virtual temperature readings with realistic variation

#### `ds18x20.js`
**Purpose:** DS18X20 sensor family simulation
**Features:** Extended sensor simulation capabilities

#### `raspi-i2c.js`
**Purpose:** Raspberry Pi I2C interface simulation
**Features:** Virtual I2C device communication

#### `readme.md`
**Purpose:** Simulation documentation and usage instructions

---

## Third-Party Libraries

### `ABElectronics_NodeJS_Libraries/`
**Purpose:** Hardware interface libraries for AB Electronics boards
**Components:**

#### Core Libraries (`lib/`)
- `adcdacpi/` - ADC/DAC Pi board interface
- `adcdifferentialpi/` - ADC Differential Pi board
- `adcpi/` - ADC Pi board interface
- `expanderpi/` - Expander Pi multi-function board
- `i2cswitch/` - I2C multiplexer control
- `iopi/` - IO Pi digital I/O board
- `iozero32/` - IO Zero 32 digital I/O
- `rtcpi/` - Real-time clock module
- `servopi/` - Servo controller board

#### Example Code (`examples/`)
- Complete usage examples for each library
- Demonstration scripts for hardware testing
- Integration patterns and best practices

#### Testing (`unittests/`)
- Comprehensive unit test suite
- Hardware validation tests
- Automated testing framework

**License:** Open source with permissive licensing
**Documentation:** Each library includes detailed README files

---

## Documentation

### `docs/` Directory
**Purpose:** Project documentation and GitHub Pages site

#### `_config.yml`
**Purpose:** Jekyll configuration for GitHub Pages
**Features:** Automated documentation site generation

#### `README.md`
**Purpose:** Main project documentation
**Contents:**
- Project overview
- Installation instructions
- Usage examples
- API documentation links

### `log.txt`
**Purpose:** Application log file
**Contents:** Runtime logs, error messages, and debug information

---

## Brewstack Framework

### `src/brewstack/` Directory
**Purpose:** Advanced brewing algorithm framework

#### `brewingAlgorithms/`
**Purpose:** Specialized brewing calculation and control algorithms
**Potential Contents:**
- Mash temperature step control
- Fermentation profile management
- Hop addition timing
- Carbonation calculations

#### `common/`
**Purpose:** Shared utilities for brewing operations
**Potential Contents:**
- Unit conversion utilities
- Recipe scaling algorithms
- Brewing constant definitions
- Mathematical helpers

---

## File Organization Summary

```
brewnode-server/
├── 📄 Configuration Files
│   ├── package.json              # NPM configuration
│   ├── commitlint.config.js      # Git commit linting
│   └── .gitignore               # Version control exclusions
├── 🚀 Application Entry
│   └── index.js                 # Main server entry point
├── 📋 API Specification
│   └── api.yaml                 # OpenAPI 3.0 specification
├── 🎮 Controllers
│   ├── brewnode.js              # Core brewing operations
│   ├── mysql.js                 # Database operations
│   ├── common.js                # Shared utilities
│   └── brewfather-*.js          # Brewfather integration
├── ⚙️ Core Services
│   ├── broker.js                # Event broker
│   ├── start-stop.js            # Lifecycle management
│   ├── probes*.js               # Temperature sensing
│   ├── pwm.js                   # PWM control
│   └── tilt.js                  # Tilt hydrometer
├── 🔧 Hardware Services
│   └── services/                # Specialized hardware control
├── 🎭 Simulation
│   └── sim/                     # Hardware simulation
├── 📚 Third-Party Libraries
│   └── ABElectronics_NodeJS_Libraries/
└── 📖 Documentation
    └── docs/                    # Project documentation
```

**Total Estimated Lines of Code:** ~10,000+ lines
**Primary Language:** JavaScript (Node.js)
**Architecture:** Microservices with hardware abstraction
**Deployment Target:** Raspberry Pi (with simulation fallback)
