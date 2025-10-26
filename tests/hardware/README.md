# Raspberry Pi Test Configuration

This directory contains tests that only run on Raspberry Pi hardware.

## Test Categories

### 🔧 Hardware Integration Tests
- **GPIO Operations**: Real GPIO pin control and status reading
- **I2C Communications**: Actual I2C bus operations with MCP23017 expanders  
- **OneWire Sensors**: DS18B20/DS18X20 temperature sensor detection and reading
- **Hardware Timing**: Performance tests for real hardware operations

### ⚡ Real-time Hardware Tests
- **Pump Control**: Physical pump switching via I2C
- **Valve Control**: Solenoid valve operation via GPIO
- **Temperature Monitoring**: Live sensor data collection
- **Watchdog Operations**: Hardware watchdog timer functionality

### 🍺 Brewery Simulation Tests
- **Complete Brew Cycles**: End-to-end brewery operation simulation
- **Concurrent Operations**: Multi-device coordination testing
- **Error Recovery**: Hardware fault tolerance and recovery
- **Resource Management**: Proper hardware resource cleanup

## Running Pi-Only Tests

### On Raspberry Pi Hardware:
```bash
# Run all hardware tests
npm run test:pi

# Run specific hardware test suite
npm test -- tests/hardware/pi-hardware.test.js

# Run with hardware coverage
npm run test:pi:coverage

# Run in watch mode during Pi development
npm run test:pi:watch
```

### On Development Machines:
These tests will be automatically skipped on non-Pi systems:
```bash
# Will show "skipped" for Pi-specific tests
npm test
```

## Hardware Requirements

### ✅ Required for Tests:
- **Raspberry Pi 4B** (or compatible)
- **Raspbian/Raspberry Pi OS** (Bullseye/Bookworm)
- **GPIO Access** (user in gpio group)
- **I2C Enabled** (`/dev/i2c-1` accessible)
- **OneWire Enabled** (w1-gpio module loaded)

### 🔧 Hardware Connections:
- **MCP23017 I2C Expanders** on bus 1 (addresses 0x20, 0x21)
- **DS18B20 Temperature Sensors** on GPIO 4 (OneWire)
- **Relay Boards** for pump/valve control
- **Hardware Watchdog** timer (optional)

## Test Detection Logic

Tests use `brewdefs.isRaspPi()` to detect Pi hardware:

```javascript
const describeOnPi = brewdefs.isRaspPi() ? describe : describe.skip;

describeOnPi('Pi Hardware Tests', () => {
  // Tests only run on actual Pi hardware
});
```

### Detection Criteria:
1. ✅ Linux platform (`process.platform === 'linux'`)
2. ✅ Pi OS detected (`/etc/os-release` contains Raspbian/bullseye/bookworm)
3. ✅ Pi CPU detected (`/proc/cpuinfo` contains "Raspberry Pi")

## Safety Features

### 🛡️ Non-Destructive Testing:
- **Read Operations**: Primarily status/sensor reading
- **Safe I2C Ops**: Brief on/off cycles for pumps/valves
- **Timeout Protection**: All operations have time limits
- **Resource Cleanup**: Proper shutdown in test teardown

### ⚠️ Test Isolation:
- **Service Cleanup**: Stop all services after each test
- **State Reset**: Return hardware to safe state
- **Error Handling**: Graceful handling of hardware faults
- **Resource Locks**: Prevent concurrent hardware access conflicts

## Continuous Integration

### GitHub Actions (Pi Runner):
```yaml
- name: Run Pi Hardware Tests
  if: matrix.os == 'raspberry-pi'
  run: |
    npm run test:pi
    npm run test:pi:coverage
```

### Local Pi Development:
```bash
# Set up pre-commit hook for Pi tests
git config core.hooksPath .githooks

# Run tests before each commit (on Pi only)
./scripts/pre-commit-pi-tests.sh
```

## Troubleshooting

### Common Issues:

**❌ I2C Permission Denied:**
```bash
sudo usermod -a -G i2c $USER
# Logout and login again
```

**❌ GPIO Permission Denied:**
```bash  
sudo usermod -a -G gpio $USER
# Logout and login again
```

**❌ OneWire Not Working:**
```bash
# Enable OneWire in /boot/config.txt
echo "dtoverlay=w1-gpio" | sudo tee -a /boot/config.txt
sudo reboot
```

**❌ Tests Timeout:**
- Check hardware connections
- Verify I2C devices: `i2cdetect -y 1`
- Check OneWire devices: `ls /sys/bus/w1/devices/`

### Debug Mode:
```bash
# Run tests with hardware debug output
DEBUG=brewnode:hardware npm run test:pi

# Verbose hardware logging
BREWNODE_LOG_LEVEL=debug npm run test:pi
```