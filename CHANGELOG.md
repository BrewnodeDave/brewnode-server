# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.6.0](https://github.com/BrewnodeDave/brewnode-server/compare/v2.4.0...v2.6.0) (2026-02-10)


### ⚠ BREAKING CHANGES

* **rims:** None - All changes are additive

Closes #RIMS-implementation

### 🔧 Maintenance

* open/close mash in valve when modulting kettle pump ([429ea74](https://github.com/BrewnodeDave/brewnode-server/commit/429ea745cd49f97036000a5a1204513883813711))
* remove tag push workflow to prevent duplicate publishes ([339b169](https://github.com/BrewnodeDave/brewnode-server/commit/339b1694b03d2632d2ee34c65d6eb55cc0a80f76))
* update GitHub Actions workflow for npm publishing ([7d56f7f](https://github.com/BrewnodeDave/brewnode-server/commit/7d56f7f31e1215f44ed6bd75df97128ab70996ac))


### 👷 CI/CD

* bump version number ([8d8c8e4](https://github.com/BrewnodeDave/brewnode-server/commit/8d8c8e4cc5bb207769f52d477b397bdec5e20a30))


### ✨ Features

* add amient = SS or unitank ([2cec408](https://github.com/BrewnodeDave/brewnode-server/commit/2cec40883c4b93c750379d166cfe92113cfc39a2))
* add debug cli option ([65fe3fc](https://github.com/BrewnodeDave/brewnode-server/commit/65fe3fcd7a9cfd5477ff7853bdce3d07f351f3a5))
* added pump modulation ([29a7fb3](https://github.com/BrewnodeDave/brewnode-server/commit/29a7fb35b238edb623efa8f316780a683ab64b3e))
* **api:** change minimum recirculation duty cycle to 50% ([7a139e5](https://github.com/BrewnodeDave/brewnode-server/commit/7a139e50595ff24deabe3b4276e7a106b1e4ada2))
* **api:** limit recirculation duty cycle to maximum 50% ([e7714b8](https://github.com/BrewnodeDave/brewnode-server/commit/e7714b8337ba08e26a8fdca5a1d89de65033a721))
* recirculate at specific temp ([845cc7b](https://github.com/BrewnodeDave/brewnode-server/commit/845cc7b32efd2e6d7a2fbf9d8d6af586ec73b2a5))
* **rims:** add complete RIMS recirculation system with PID control ([e25bc9c](https://github.com/BrewnodeDave/brewnode-server/commit/e25bc9c117c2ec7616259eede5058e5547379dd4))
* start from any dir ([e09f4f8](https://github.com/BrewnodeDave/brewnode-server/commit/e09f4f882f77001b111bbb20c113322ff212b06b))
* support two fermenters ([c4c2e24](https://github.com/BrewnodeDave/brewnode-server/commit/c4c2e2427ad049a2a5232366403ebb46e8340806))


### ⚡ Performance

* **temp:** optimize temperature retry to only re-read failed sensors ([31f47ac](https://github.com/BrewnodeDave/brewnode-server/commit/31f47ac741ad7e37d2caf1f83e910030d2425100))


### 🐛 Bug Fixes

* . ([8b6c7b7](https://github.com/BrewnodeDave/brewnode-server/commit/8b6c7b74768dd40bba1d4c67fdb15e6baa6e7e82))
* add mod time to recirc ([386dd9e](https://github.com/BrewnodeDave/brewnode-server/commit/386dd9eb6633e09e245986686fd2d88f0c13c418))
* **api:** correct sensorStatus All endpoint array spreading ([6afd576](https://github.com/BrewnodeDave/brewnode-server/commit/6afd5768e7783553aaf21a126f2e01272af76152))
* debug ([a83b839](https://github.com/BrewnodeDave/brewnode-server/commit/a83b839c9b38e23b0ac36a99203bfb18dcf62587))
* debug ([5af29a4](https://github.com/BrewnodeDave/brewnode-server/commit/5af29a4b4b5d5691a4aac67da6c0ebeed41b1851))
* pumnp management during temp readings ([e7932c7](https://github.com/BrewnodeDave/brewnode-server/commit/e7932c712c2cc671738c590575dc63a40f7549f1))
* retry temp readings ([21fa9a2](https://github.com/BrewnodeDave/brewnode-server/commit/21fa9a225e7b5f5b8fde4f8eecf3c073d881333f))
* temp ([cd7f2d0](https://github.com/BrewnodeDave/brewnode-server/commit/cd7f2d0c6554c0814aeed6b55bdbcb19341c8314))
* **temp-service:** service not starting ([dbfbfb4](https://github.com/BrewnodeDave/brewnode-server/commit/dbfbfb401f68a7ac97dc0052169a4036c33a3e72))
* use mash temp for recirc ([34e1a21](https://github.com/BrewnodeDave/brewnode-server/commit/34e1a21d9026147fb6eb6bc1326d61f7cb0dc196))

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