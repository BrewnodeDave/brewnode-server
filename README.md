# 🍺 BrewNode Server

[![Node.js](https://img.shields.io/badge/Node.js-18.20.5+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Beerware-blue.svg)](LICENSE)
[![Raspberry Pi](https://img.shields.io/badge/Platform-Raspberry%20Pi-red.svg)](https://www.raspberrypi.org/)

**A comprehensive Node.js backend server for brewery automation and monitoring.**

BrewNode Server provides REST APIs, real-time data streaming, and hardware integration for complete brewery control. Designed to run on Raspberry Pi with custom hardware, but includes full simulation support for development on any platform.

## 🚀 Quick Start

### Installation
```bash
git clone https://github.com/BrewnodeDave/brewnode-server.git
cd brewnode-server
npm install
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

### I2C Expansion Boards
Supports AB Electronics boards for additional I/O:
- **ADC Pi** - 18-bit analog to digital converter
- **IO Pi** - 32-channel digital I/O expander
- **Expander Pi** - Multi-function board with ADC, DAC, I/O, and RTC

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
```bash
# Run unit tests
npm test

# Hardware simulation tests
npm run test:simulation

# Integration tests
npm run test:integration
```

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

