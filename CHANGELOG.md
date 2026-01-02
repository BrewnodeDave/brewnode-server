# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### ✨ Features

* **rims:** Add complete RIMS (Recirculating Infusion Mash System) support
  - `/kettlePumpModulate` and `/mashPumpModulate` endpoints for pump cycling
  - `/recirculate` endpoint with PID temperature control and duty cycle management
  - `/recirculate/dutycycle` for dynamic duty cycle updates during operation
  - `/recirculate/status` for state persistence across frontend navigation
  - Duty cycle control (1-99%, default 50%) replaces fixed on-time
  - PID controller integration (Kp=800, Ki=0.3, Kd=100) for mash temperature
  - Automatic mash-in valve synchronization with kettle pump
  - Simulation speed factor support for all timing operations

### 🐛 Bug Fixes

* **temperature:** Add retry logic with pump management for DS18x20 sensors
  - 3 retry attempts with 200ms delays
  - Automatic pump shutdown after first failed read (500ms settle time)
  - Stops both mash AND kettle pumps to eliminate electrical interference
  - Validates readings: rejects 85°C error code, null, undefined, out-of-range
  - Applied to both `getTempWithRetry()` and `getAllTemps()`
  - Significantly improves sensor reliability during pump operation

### 🔧 Configuration

* **debug:** Add `--debug` / `-d` command line flag to enable console logging
  - Controls brewlog console output (default: disabled for performance)
  - Useful for development and troubleshooting

### 🎨 Frontend

* **rims:** Add RecirculationControl component to Process Control page
  - Inline (non-modal) control for multi-page navigation during operation
  - Real-time status polling (3-second intervals)
  - Temperature and duty cycle controls
  - State persistence via backend status endpoint
  - Recycle icon for RIMS section
* **proxy:** Add `/recirculate` routes to Vite proxy configuration


## [2.4.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.3.1...v2.4.0) (2025-12-11)


### 🐛 Bug Fixes

* **api:** speedFactor endpoints now return JSON instead of plain text ([2345900](https://github.com/BrewnodeDave/brewnode-server/commit/23459003b66e4f6d620e386a824c310d5bfb9f0d))
* return kettle power ([56a9187](https://github.com/BrewnodeDave/brewnode-server/commit/56a9187b935189c4b9ae7f0aa207d5ed8b9dbac6))

### [2.3.1](https://github.com/BrewnodeDave/brewnode-server/compare/v2.3.0...v2.3.1) (2025-11-18)

## [2.3.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.0.1...v2.3.0) (2025-11-18)


### ⚠ BREAKING CHANGES

* Added brewery service startup script to handle I2C initialization

Problem Solved:
- Fixed 'modprobe: not found' errors in systemd service environment
- I2C libraries (raspi, raspi-i2c) require kernel modules but modprobe unavailable
- Service startup failures due to missing I2C module loading

Solution Components:
📄 scripts/start-brewery-service.sh - Smart startup script with module loading
📄 scripts/brewnode-server.service - Production systemd service configuration
📄 scripts/DEPLOYMENT.md - Complete deployment guide with troubleshooting
📄 package.json - Added 'start:service' npm script

Features:
✅ Pre-loads I2C modules (i2c-dev, i2c-bcm2835) before Node.js startup
✅ Pre-loads OneWire modules (w1-gpio, w1-therm) for temperature sensors
✅ Hardware availability validation with clear status messages
✅ Graceful fallback when modprobe unavailable (assumes pre-loaded modules)
✅ Proper PATH and capabilities configuration for systemd services
✅ Multiple deployment options (automatic, manual, boot-time loading)

Deployment:
sudo cp scripts/brewnode-server.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl restart brewnode-server

This resolves all I2C initialization issues for production Pi deployments!
* Added brewery service startup script to handle I2C initialization

Problem Solved:
- Fixed 'modprobe: not found' errors in systemd service environment
- I2C libraries (raspi, raspi-i2c) require kernel modules but modprobe unavailable
- Service startup failures due to missing I2C module loading

Solution Components:
📄 scripts/start-brewery-service.sh - Smart startup script with module loading
📄 scripts/brewnode-server.service - Production systemd service configuration
📄 scripts/DEPLOYMENT.md - Complete deployment guide with troubleshooting
📄 package.json - Added 'start:service' npm script

Features:
✅ Pre-loads I2C modules (i2c-dev, i2c-bcm2835) before Node.js startup
✅ Pre-loads OneWire modules (w1-gpio, w1-therm) for temperature sensors
✅ Hardware availability validation with clear status messages
✅ Graceful fallback when modprobe unavailable (assumes pre-loaded modules)
✅ Proper PATH and capabilities configuration for systemd services
✅ Multiple deployment options (automatic, manual, boot-time loading)

Deployment:
sudo cp scripts/brewnode-server.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl restart brewnode-server

This resolves all I2C initialization issues for production Pi deployments!
* Server startup now validates Pi hardware before starting services

Features:
- Runs Pi hardware tests automatically when starting on Raspberry Pi
- Blocks server startup if hardware validation fails
- Skips validation on non-Pi systems (development machines)
- Provides SKIP_HARDWARE_TESTS environment variable for debugging
- Enhanced startup logging with clear success/failure indicators
- Comprehensive error reporting for failed hardware tests

New npm scripts:
- npm run start:safe - Start with explicit hardware validation
- npm run start:skip-tests - Start bypassing hardware tests (dev only)

Safety benefits:
- Prevents brewery server from starting with faulty hardware
- Early detection of I2C, GPIO, and temperature sensor issues
- Reduces risk of brewery process failures due to hardware problems
- Clear diagnostic information for troubleshooting hardware issues

Production deployment: Server will automatically validate all connected
brewery hardware (pumps, valves, sensors) before accepting connections

### 🧪 Tests

* Add comprehensive temperature sensor validation test ([0d19abc](https://github.com/BrewnodeDave/brewnode-server/commit/0d19abcf0e1608b1190d5d870bcc0be06d7dc57e))


### 🐛 Bug Fixes

* Complete removal of Jest-based validation code ([4e7248a](https://github.com/BrewnodeDave/brewnode-server/commit/4e7248a2dfd71bf06cdfef80af1cc1a2c50af490))
* Correct pump service method names in Pi hardware tests ([78432a8](https://github.com/BrewnodeDave/brewnode-server/commit/78432a8d2a18fbce452c59e478f2215f7ff68efc))
* Correct valve name in brewery simulation test ([b89d45b](https://github.com/BrewnodeDave/brewnode-server/commit/b89d45b9b47bffe72f23d24aefbb61592ceb757c))
* export missing pump names to resolve circular dependency warnings ([3caed21](https://github.com/BrewnodeDave/brewnode-server/commit/3caed210b1ba79fe54ff8ed08e0ff1510baf77d2))
* Improve Pi hardware tests to handle missing hardware gracefully ([cd76c57](https://github.com/BrewnodeDave/brewnode-server/commit/cd76c5704661d08143551a0f86fe05c87e433598))
* resolve circular dependency warnings in sim.js ([fd00d42](https://github.com/BrewnodeDave/brewnode-server/commit/fd00d42007339586dd2cbc834f16443dee19c339))
* Update temperature sensor test to match actual service data structure ([7a2dc7e](https://github.com/BrewnodeDave/brewnode-server/commit/7a2dc7e62ad3bf6d13ab7dc21bf3e70d9d0a41ed))
* Use correct valve names in Pi hardware tests ([0516620](https://github.com/BrewnodeDave/brewnode-server/commit/0516620050dc61bdef4d11c896d196c6c96bcc43))
* wrong include ([6b3d31c](https://github.com/BrewnodeDave/brewnode-server/commit/6b3d31cc80419a48158183076b01c5e12993a5bc))


### ✨ Features

* Add Beerware LICENSE file ([b9c2fd2](https://github.com/BrewnodeDave/brewnode-server/commit/b9c2fd2679800ed6b6687fdb6410989ac1a2db35))
* Add comprehensive Pi hardware tests and update all documentation ([a810970](https://github.com/BrewnodeDave/brewnode-server/commit/a810970a707568fcb145be9034d3a40ae37222c8))
* Add Pi hardware validation during server startup ([3ad99e5](https://github.com/BrewnodeDave/brewnode-server/commit/3ad99e5cd97ca9be559d15aba26145e64a085f14))
* add release process ([f9ef177](https://github.com/BrewnodeDave/brewnode-server/commit/f9ef177a3cc32a407e49bba4cc4163c044e94f08))
* Add systemd service deployment solution for I2C module issues ([f42e56a](https://github.com/BrewnodeDave/brewnode-server/commit/f42e56aa5b4ab744ab5cf0c3aa9a73fa04319a25))
* Add systemd service deployment solution for I2C module issues ([fbec381](https://github.com/BrewnodeDave/brewnode-server/commit/fbec381c438964cbdca908c42209b32c8ae2bea4))


### 🔧 Maintenance

* missed files ([e475adc](https://github.com/BrewnodeDave/brewnode-server/commit/e475adc589e900babac36d897c5cb67c11af4a9c))

## [2.2.0] - 2025-11-18

### ✨ Features
- Added comprehensive test suite with 245 passing tests across 22 test suites
- Implemented complete Brewfather controller testing (fermentables, hops, miscs)
- Added publish/subscribe messaging system validation
- Enhanced brewing algorithms and data processing coverage

### 🧪 Tests  
- Increased test coverage from 26.58% to 34.99% statements (+8.41%)
- Achieved 100% coverage on critical controller modules
- Fixed all failing tests and eliminated flaky timing-based tests
- Added comprehensive unit tests for temperature probes configuration
- Implemented reliable async testing with proper promise handling

### 🐛 Bug Fixes
- Fixed syntax error in brewdata.js (stray character removal)
- Fixed const reassignment issue in brewlog.js 
- Fixed missing imports in brewfather controller files
- Resolved timing test reliability issues in publish.test.js

### 📚 Documentation
- Updated README with accurate test statistics and coverage breakdown
- Added detailed testing achievements section
- Updated test structure documentation to reflect current 22 test files
- Added comprehensive coverage table showing module-by-module statistics

### 🔧 Maintenance
- Fixed code quality issues identified during testing
- Improved error handling in controller modules
- Enhanced logging functionality validation