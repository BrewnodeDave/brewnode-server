# 🍺 BrewNode Server

[![npm version](https://badge.fury.io/js/%40brewnode%2Fserver.svg)](https://www.npmjs.com/package/@brewnode/server)
[![Node.js](https://img.shields.io/badge/Node.js-18.20.5+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Beerware-blue.svg)](LICENSE)
[![Raspberry Pi](https://img.shields.io/badge/Platform-Raspberry%20Pi-red.svg)](https://www.raspberrypi.org/)

**A comprehensive Node.js backend server for brewery automation and monitoring.**

BrewNode Server provides REST APIs, real-time data streaming, and hardware integration for complete brewery control. Designed to run on Raspberry Pi with custom hardware, but includes full simulation support for development on any platform.

## � Installation

### From NPM
```bash
npm install @brewnode/server
```

### From Source
```bash
git clone https://github.com/BrewnodeDave/brewnode-server.git
cd brewnode-server
npm install
```

## 🚀 Quick Start

### Basic Usage
```javascript
const brewnode = require('@brewnode/server');
// Start the BrewNode server
brewnode.start();
```

### Development
```bash
npm start
```

### API Documentation
Open your browser to explore the interactive API:
```
http://localhost:8080/docs/
```

Add your Brewfather credentials using the "Authorize" button for full API access.

![API Documentation](https://github.com/user-attachments/assets/d7a7b5a4-5cde-4bf0-ab53-5584fdd3114e)

## 📋 Complete Documentation

This project includes comprehensive documentation for all components:

### 📚 Documentation Index
- **[📄 Complete File Documentation](FILE_DOCUMENTATION.md)** - Overview of all files and their purposes
- **[🔧 API Documentation](API_DOCUMENTATION.md)** - Detailed OpenAPI specification guide
- **[🎮 Controllers Guide](controllers/README.md)** - REST API controller documentation
- **[⚙️ Source Code Guide](src/README.md)** - Core services and business logic
- **[🔌 Hardware Integration](HARDWARE_DOCUMENTATION.md)** - Hardware interfaces and device drivers
- **[🛠️ Hardware Requirements](HARDWARE_REQUIREMENTS.md)** - Complete hardware specification & procurement guide
- **[🧪 Testing Guide](tests/README.md)** - Comprehensive test suite documentation

### 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile App     │    │  Brewfather     │
│                 │    │                 │    │     API         │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          │ HTTP/WebSocket      │ HTTP/WebSocket      │ HTTP
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │    BrewNode Server      │
                    │  (Express + Socket.IO)  │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │     Event Broker        │
                    │  (Real-time messaging)  │
                    └────────────┬────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
┌───────▼────────┐   ┌───────────▼────────┐   ┌─────────▼─────────┐
│  Hardware      │   │    Database        │   │   External APIs   │
│   Services     │   │   (MySQL)          │   │  (Brewfather)     │
│                │   │                    │   │                   │
│ • Temperature  │   │ • Brew Data        │   │ • Recipes         │
│ • Pumps        │   │ • Sensor Logs      │   │ • Batches         │
│ • Valves       │   │ • Process History  │   │ • Ingredients     │
│ • I2C Devices  │   │ • Configuration    │   │ • Streaming       │
└────────────────┘   └────────────────────┘   └───────────────────┘
```

## 🔧 Features

### 🌡️ Temperature Monitoring
- **DS18B20/DS18X20** OneWire temperature sensors
- **Multi-sensor support** (up to 127 sensors per bus)
- **PID temperature control** with safety limits
- **Real-time alerts** and logging

### 🚰 Process Control
- **Pump management** with flow monitoring
- **Valve positioning** with automated sequencing
- **PWM control** for heating elements
- **Glycol cooling system** integration

### 📡 Real-Time Communication
- **Socket.IO** for live data streaming
- **Event-driven architecture** with publish-subscribe pattern
- **Multi-client support** with synchronized data
- **Mobile-friendly** WebSocket connections

### 🔗 Brewfather Integration
- **Complete API proxy** for Brewfather v2 API
- **Automatic data streaming** to Brewfather
- **Recipe synchronization** and batch management
- **Ingredient database** access

### 🗄️ Data Management
- **MySQL database** for persistent storage
- **Historical data** retention and analysis
- **Export capabilities** for brewing logs
- **Backup and restore** functionality

### 🎛️ Hardware Support
- **Raspberry Pi optimized** with GPIO control
- **I2C device support** (AB Electronics boards)
- **Bluetooth integration** (Tilt hydrometers)
- **Simulation mode** for development without hardware

## 🛠️ Installation & Setup

### System Requirements
- **Node.js** 18.20.5 or higher
- **Raspberry Pi OS** (for hardware features)
- **MySQL** 5.7+ or compatible database
- **Git** for version control

### Raspberry Pi Setup
```bash
# Enable I2C and OneWire
sudo raspi-config
# Navigate to Interface Options and enable I2C and 1-Wire

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup BrewNode
git clone https://github.com/BrewnodeDave/brewnode-server.git
cd brewnode-server
npm install
```

### Environment Configuration
Create a `.env` file with your configuration:
```bash
# Database Configuration
DB_HOST=localhost
DB_USER=brewnode
DB_PASSWORD=your_password
DB_NAME=brewnode_db

# Brewfather Integration
BREWFATHER_USERNAME=your_brewfather_username
BREWFATHER_PASSWORD=your_brewfather_password

# Optional: External service configuration
ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN=your_rollbar_token
```

### Production Deployment

#### Autostart on Raspberry Pi
Add to `/etc/rc.local` before the `exit 0` line:
```bash
# Start BrewNode Server
/home/pi/.nvm/versions/node/v18.20.5/bin/node /home/pi/brewnode-server/index.js &
```

#### Process Manager (Recommended)
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start index.js --name "brewnode-server"

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

## 🔌 Hardware Integration

### Temperature Sensors (DS18B20)
```
DS18B20 Wiring:
VDD (Red)    → 3.3V (Pin 1)
GND (Black)  → Ground (Pin 6)  
DQ (Yellow)  → GPIO4 (Pin 7) + 4.7kΩ pullup to 3.3V
```

### I2C Expansion & Device Control
**Complete brewery automation via I2C bus expansion**

**Hardware Setup:**
- **I2C Bus:** Uses Raspberry Pi pins 3 (SDA) & 5 (SCL)
- **Dual MCP23017 Expanders:** 32 digital I/O pins total
- **Addresses:** 0x20 (primary), 0x21 (secondary)

**Controlled Devices (18 total):**
- **4 Pumps:** Glycol, Kettle, Mash, Fermenter circulation
- **4 Valves:** Flow direction control for brewing process
- **2 Heaters:** 3000W kettle heater + glycol temperature control
- **7 Relays/Switches:** General purpose control & power switching
- **1 Fan:** Cooling system temperature management

**API Control:**
```bash
# Control any I2C device via REST API
PUT /i2c?bit=8&value=1  # Turn on kettle pump (bit 8)
PUT /i2c?bit=17&value=1 # Turn on kettle heater (bit 17)
```

**Development Features:**
- Complete hardware simulation for cross-platform development
- Individual device testing via command-line utilities
- Real-time monitoring and status feedback

### Bluetooth Devices
- **Tilt Hydrometers** - Real-time gravity and temperature monitoring
- Automatic device discovery and data collection

## 🌐 API Usage

### Core Endpoints
```bash
# Get all brew names
GET /mysql/brewnames

# Get brew data with date filtering
GET /brewdata?brewname=MyBrew&since=2023-10-01T00:00:00Z

# Get current brewing status
GET /brewing

# Hardware control
POST /hardware/pump/start
POST /hardware/valve/position
```

### Brewfather Proxy
```bash
# List recipes (requires authentication)
GET /recipes

# Get specific batch
GET /batches/{batchId}

# Stream data to Brewfather
POST /stream
```

### Real-Time Data
```javascript
// Connect to WebSocket
const socket = io('http://localhost:4000');

// Listen for temperature updates
socket.on('temperature', (data) => {
  console.log('Temperature:', data.value, '°C');
});

// Listen for pump status
socket.on('pump-status', (data) => {
  console.log('Pump running:', data.running);
});
```

## 🧪 Development & Testing

### Simulation Mode
When running on non-Raspberry Pi systems, hardware operations are automatically simulated:
- **Virtual sensors** with realistic behavior
- **Simulated I/O** operations
- **Mock hardware** responses
- **Development-friendly** debugging

### Testing

[![Tests](https://img.shields.io/badge/Tests-126%20total-brightgreen.svg)](tests/)
[![Test Suites](https://img.shields.io/badge/Test%20Suites-13%20total-brightgreen.svg)](tests/)
[![Coverage](https://img.shields.io/badge/Coverage-Comprehensive-blue.svg)](tests/)
[![Pi Tests](https://img.shields.io/badge/Pi%20Tests-22%20hardware-orange.svg)](tests/hardware/)

**Comprehensive test suite with 126+ tests across multiple environments:**

```bash
# Development Testing (cross-platform)
npm test                  # Run all development tests (104 tests)
npm run test:coverage     # Run with coverage reporting  
npm run test:watch        # Run in watch mode (development)

# Raspberry Pi Hardware Testing (Pi only)
npm run test:pi           # Run Pi hardware tests (22 tests)
npm run test:pi:coverage  # Pi tests with hardware coverage
./scripts/run-pi-tests.sh # Helper script with prerequisites check

# Complete Testing
npm run test:all          # Run both development and Pi tests
```

#### Test Coverage
- **✅ Unit Tests** - All services, algorithms, and utilities (78 tests)
- **✅ Integration Tests** - API endpoints, WebSocket functionality, server startup (26 tests)
- **✅ Hardware Simulation** - Complete mocking for cross-platform development
- **✅ Pi Hardware Tests** - Real hardware validation on Raspberry Pi (22 tests)
- **✅ Database Testing** - MySQL service layer with connection handling
- **✅ External API Testing** - Brewfather integration with mock responses

#### Test Structure
```
tests/
├── setup.js              # Global mocks and test configuration
├── unit/                  # Unit tests for individual modules (78 tests)
│   ├── basic.test.js     # Core functionality verification
│   ├── temp-service.test.js      # Temperature monitoring
│   ├── pump-service.test.js      # Pump control (fixed circular dependency)
│   ├── mysql-service.test.js     # Database operations
│   ├── brewfather-service.test.js # External API integration
│   ├── broker.test.js            # Event messaging
│   ├── k2f-algorithm.test.js     # Temperature conversion
│   ├── m2k-algorithm.test.js     # Unit conversions
│   └── delay.test.js             # Utility functions
├── integration/           # End-to-end integration tests (26 tests)
│   ├── api.test.js       # REST API endpoints
│   ├── socket.test.js    # WebSocket real-time communication
│   └── server.test.js    # Main server startup and configuration
└── hardware/              # Raspberry Pi hardware tests (22 tests)
    ├── pi-hardware.test.js       # Real hardware integration tests
    ├── setup-pi-tests.js         # Pi hardware test environment setup
    └── README.md                 # Pi hardware testing documentation
```

For detailed testing information, see **[📋 Testing Guide](tests/README.md)**

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Follow conventional commits: `feat: add new sensor support`
4. Ensure tests pass and add new tests for features
5. Submit a pull request

## 📊 Monitoring & Logging

### Built-in Monitoring
- **System health checks** via watchdog service
- **Performance metrics** collection
- **Error logging** with Rollbar integration
- **Real-time dashboards** via web interface

### Log Files
```bash
# Application logs
tail -f log.txt

# System logs (on Raspberry Pi)
journalctl -u brewnode-server -f

# Hardware-specific logs
tail -f /var/log/brewnode/hardware.log
```

## 🔒 Security

### API Security
- **API key authentication** for sensitive operations
- **CORS configuration** for web client access
- **Input validation** on all endpoints
- **Rate limiting** to prevent abuse

### Network Security
- **HTTPS support** (configure reverse proxy)
- **Local network isolation** recommended
- **VPN access** for remote monitoring
- **Regular security updates**

## 📈 Performance

### Optimizations
- **Efficient polling** intervals for brewing time scales
- **Memory management** for long-running processes
- **Database indexing** for fast queries
- **Caching** of frequently accessed data

### Scalability
- **Multi-client support** via Socket.IO
- **Horizontal scaling** potential with load balancer
- **Database clustering** support
- **Microservice architecture** ready

## 📞 Support & Community

### Getting Help
- **Documentation** - Start with the comprehensive docs in this repository
- **Issues** - Report bugs and feature requests via GitHub Issues
- **Discussions** - Join community discussions on GitHub Discussions

### License
This project is licensed under the **Beerware License** - see the LICENSE file for details.

*"THE BEER-WARE LICENSE" (Revision 42): As long as you retain this notice you can do whatever you want with this stuff. If we meet some day, and you think this stuff is worth it, you can buy me a beer in return.*

---

**Happy Brewing! 🍻**

*BrewNode Server - Automating the art of brewing, one batch at a time.*

