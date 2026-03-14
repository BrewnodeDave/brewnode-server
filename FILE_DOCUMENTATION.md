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

**Development Scripts:**
- `npm test` - Run all development tests (104 tests)
- `npm run test:pi` - Run Pi hardware tests (22 tests, skips on non-Pi)
- `npm run test:pi:coverage` - Pi tests with coverage report
- `npm run test:pi:watch` - Pi tests in watch mode
- `npm run test:coverage` - Development tests with coverage report

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
**Size:** 1067 lines
**Key Functions:**
- Brew data retrieval and filtering
- Brewing process management
- Hardware status monitoring
- Real-time data streaming coordination
- **RIMS recirculation control:**
  - `kettlePumpModulate()` - Kettle pump on/off cycling
  - `mashPumpModulate()` - Mash pump on/off cycling
  - `recirculate()` - Complete RIMS operation with PID temperature control
    * accepts optional `mashDutyCycle` parameter for independent mash pump modulation
  - `updateDutyCycle()` - Dynamic duty cycle updates during recirculation
    * now also accepts `mashDutyCycle` to adjust mash pump cycle
  - `getRecirculationStatus()` - Current recirculation state for UI persistence
  - `startStopKettlePumpModulation()` - Helper function for pump control logic
  - Global state tracking: `recirculationState` object

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

#### `tilt.js` (Removed)
**Status:** File removed due to missing dependencies
**Previous Purpose:** Tilt Hydrometer integration for Bluetooth gravity sensors
**Note:** Feature can be re-implemented when dependencies are available

---

## Hardware Integration

### Service Layer (`src/services/`)

The services directory contains specialized hardware control modules:

#### Temperature Services
- `temp-service.js` - Main temperature service coordinator
- `temp-service-ds18b20.js` - DS18B20 sensor service
- `temp-service-ds18x20.js` - DS18X20 sensor service with electrical interference mitigation
  - **Features:** Retry logic with pump management (3 retries, 200ms delays)
  - **Pump Shutdown:** Automatically stops mash and kettle pumps after first failed read
  - **Validation:** Rejects 85°C error code, null, undefined, out-of-range values
  - **Settle Time:** 500ms wait after pump shutdown for electrical noise to dissipate
- `temp-controller-service.js` - PID temperature control (Kp=800, Ki=0.3, Kd=100)
  - **Features:** Same retry logic and pump management as temp-service-ds18x20
  - **RIMS Support:** Used by recirculation endpoint for mash temperature control
  - **getTempWithRetry():** Stops both pumps, waits, retries, validates, restores pumps

#### I2C Device Services
- `i2c_raspi-service.js` - **Primary I2C Interface**
  - **Purpose:** Raspberry Pi I2C bus control for 32-bit GPIO expansion
  - **Hardware:** Dual MCP23017 I2C expanders (0x20, 0x21)
  - **Features:** Bit-level read/write, direction control, hardware abstraction
  - **Devices:** Controls 18 brewery automation devices via I2C pins
- `i2c_raspi-service.test.js` - I2C service comprehensive unit tests
- `i2c-set.js` - **I2C Device Configuration Utility**
  - **Purpose:** Command-line tool for direct I2C pin control
  - **Usage:** `node i2c-set.js <bit> <value>`
  - **Features:** Individual pin testing and debugging

#### Brewing Equipment Services
- `kettle-heater-service.js` - **Heating Element Control**
  - **I2C Bit:** 17 (Kettle Heater - 3000W main heating element)
  - **Features:** PWM modulation, temperature control, safety interlocks
- `pump-service.js` - **Pump Operation Management**
  - **I2C Bits:** 0 (Glycol), 7 (Fermenter), 8 (Kettle), 9 (Mash)
  - **Features:** Individual pump control, status monitoring, flow management
- `valve-service.js` - **Valve Positioning Control**
  - **I2C Bits:** 1 (Fermenter), 2 (Chill Wort), 5 (Kettle), 6 (Mash In)
  - **Features:** Open/close control, position feedback, safety verification
- `fan-service.js` - **Cooling Fan Management**
  - **I2C Bit:** 10 (Cooling system fan)
  - **Features:** Variable speed control, temperature-based automation

#### Glycol System Services
- `glycol-service.js` - **Main Glycol System Coordinator**
  - **I2C Bits:** 13 (Glycol Power), 0 (Glycol Pump), 11 (Glycol Heater)
  - **Features:** Temperature control, pump management, heating/cooling automation
- `glycol-chiller-service.js` - **Chilling System Control**
  - **Purpose:** Cooling system control and monitoring
- `glycol-heater-service.js` - **Heating System Control**
  - **I2C Bit:** 11 (Glycol heater for temperature adjustment)
  - **Features:** Precise temperature control, safety monitoring

#### Process Services
- `flow-service.js` - Flow rate monitoring
- `fill-service.js` - Tank filling operations
- `wdog-service.js` - Watchdog service for system monitoring

#### External Integrations
- `brewfather-service.js` - Brewfather API client service
- `mysql-service.js` - Database service layer

#### User Interfaces
- Web interfaces served via main server application
- API documentation available at `/docs` endpoint

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

## Test Suite Architecture

### `tests/` Directory
**Purpose:** Comprehensive multi-environment testing framework ensuring code quality and hardware reliability

#### Test Structure Overview
```
tests/
├── 📄 setup.js                    # Global test configuration and mocks
├── 📄 jest.config.js              # Standard Jest configuration
├── 📄 jest.pi.config.js           # Raspberry Pi specific test configuration
├── 📁 unit/                       # Unit tests (78 tests) - Cross-platform
├── 📁 integration/                # Integration tests (26 tests) - Cross-platform
├── 📁 hardware/                   # Pi hardware tests (22 tests) - Pi only
└── 📁 scripts/                    # Test utilities and runners
```

#### Development Tests (104 tests)
**Files:** `unit/` and `integration/` directories
**Purpose:** Cross-platform development testing with complete hardware mocking

**Unit Tests (78 tests):**
- `basic.test.js` - Core functionality verification (9 tests)
- `temp-service.test.js` - Temperature monitoring service (7 tests)  
- `pump-service.test.js` - Pump control service (2 tests)
- `mysql-service.test.js` - Database operations (17 tests)
- `brewfather-service.test.js` - External API integration (14 tests)
- `broker.test.js` - Event messaging system (21 tests)
- `k2f-algorithm.test.js` - Temperature conversion algorithms (7 tests)
- `m2k-algorithm.test.js` - Mass conversion algorithms (7 tests)
- `delay.test.js` - Utility delay functions (10 tests)

**Integration Tests (26 tests):**
- `api.test.js` - REST API endpoints (10 tests)
- `socket.test.js` - WebSocket real-time communication (8 tests)
- `server.test.js` - Server startup and configuration (8 tests)

#### Raspberry Pi Hardware Tests (22 tests)
**File:** `hardware/pi-hardware.test.js`
**Purpose:** Real hardware validation on Raspberry Pi - automatically skipped on other systems

**Hardware Test Categories:**
- **Platform Detection** (2 tests) - Pi hardware identification
- **I2C Interface** (3 tests) - MCP23017 expander communication
- **GPIO Interface** (2 tests) - Physical pin control and access
- **Temperature Sensors** (3 tests) - DS18B20/OneWire sensor validation
- **Pump Hardware** (3 tests) - Real I2C pump switching operations
- **Valve Hardware** (2 tests) - GPIO valve control verification
- **Performance Testing** (2 tests) - Hardware operation timing validation
- **Integration Testing** (5 tests) - Complete brewery automation cycles

#### Test Configuration Files

**`setup.js`**
- Global test environment configuration
- Hardware mocking for cross-platform compatibility  
- Database and external API mocking
- Mock implementations for Raspberry Pi hardware interfaces

**`jest.config.js`** 
- Standard Jest configuration for development tests
- Coverage collection settings
- Test timeout and environment configuration
- Module name mapping and transforms

**`jest.pi.config.js`**
- Raspberry Pi specific test configuration
- Extended timeouts for hardware operations
- Hardware-focused coverage settings
- Pi environment detection and setup

**`scripts/run-pi-tests.sh`**
- Comprehensive Pi hardware test runner
- Hardware prerequisite validation
- User permission checking (gpio, i2c groups)
- Command-line options for different test modes

#### Test Environment Features

**Automatic Platform Detection:**
- Uses `brewdefs.isRaspPi()` to detect Raspberry Pi hardware
- Development systems: Hardware tests automatically skip
- Pi systems: Hardware tests execute with real device validation

**Hardware Safety Measures:**
- Non-destructive testing operations
- Emergency cleanup on process signals
- Resource management and proper shutdown
- Timeout protection for all hardware operations

**Mocking Strategy:**
- Complete hardware abstraction for development
- GPIO operations simulated with virtual responses
- I2C bus operations mocked with device emulation
- Temperature sensors provide realistic simulated data
- Database operations use test-specific configuration
- External APIs return predefined mock responses

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
│   └── pwm.js                   # PWM control
├── 🔧 Hardware Services
│   └── services/                # Specialized hardware control
├── 🎭 Simulation
│   └── sim/                     # Hardware simulation
├── 📚 Third-Party Libraries
│   └── ABElectronics_NodeJS_Libraries/
├── 🧪 Test Suites
│   ├── tests/unit/              # Unit tests (78 tests)
│   ├── tests/integration/       # Integration tests (26 tests)
│   ├── tests/hardware/          # Raspberry Pi hardware tests (22 tests)
│   ├── setup.js                 # Global test configuration
│   ├── jest.config.js           # Jest test configuration
│   ├── jest.pi.config.js        # Pi-specific test configuration
│   └── scripts/run-pi-tests.sh  # Pi hardware test runner
└── 📖 Documentation
    └── docs/                    # Project documentation
```

**Total Estimated Lines of Code:** ~12,000+ lines
**Primary Language:** JavaScript (Node.js)
**Architecture:** Microservices with hardware abstraction
**Deployment Target:** Raspberry Pi (with simulation fallback)
