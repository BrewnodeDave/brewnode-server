#!/usr/bin/env node

/*
 * Hardware Diagnostics Script
 * Helps troubleshoot temperature sensor hardware issues
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Polyfill os.tmpDir() for newer Node.js versions
if (!os.tmpDir) {
  os.tmpDir = function() {
    return os.tmpdir();
  };
}

console.log('🔧 BrewNode Temperature Sensor Hardware Diagnostics\n');
console.log('════════════════════════════════════════════════════════════════\n');

// Check 1: Platform
console.log('1️⃣  Platform Detection:');
try {
  const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
  if (cpuInfo.includes('BCM') || cpuInfo.includes('ARM')) {
    console.log('   ✅ Raspberry Pi hardware detected');
  } else {
    console.log('   ⚠️  Not detected as Raspberry Pi hardware');
  }
} catch (e) {
  console.log('   ❌ Cannot read /proc/cpuinfo:', e.message);
}

// Check 2: OneWire Bus
console.log('\n2️⃣  OneWire Bus:');
const w1Path = '/sys/bus/w1/devices';
if (fs.existsSync(w1Path)) {
  console.log('   ✅ OneWire bus available at', w1Path);
  try {
    const devices = fs.readdirSync(w1Path);
    console.log(`   ✅ Found ${devices.length} devices on OneWire bus:`);
    devices.forEach(d => {
      if (d.startsWith('28-') || d.startsWith('10-')) {
        console.log(`      • ${d} (DS18x20 sensor)`);
      } else if (d !== 'w1_bus_master1' && d !== 'w1_bus_master0') {
        console.log(`      • ${d}`);
      }
    });
    const tempSensors = devices.filter(d => d.startsWith('28-'));
    if (tempSensors.length === 0) {
      console.log('   ⚠️  No DS18x20 temperature sensors detected!');
      console.log('      Check sensor connections and /boot/config.txt for w1-gpio overlay');
    }
  } catch (e) {
    console.log('   ❌ Cannot read OneWire devices:', e.message);
  }
} else {
  console.log('   ❌ OneWire bus NOT found at', w1Path);
  console.log('      Enable it with: sudo raspi-config → Interfaces → 1-Wire');
}

// Check 3: GPIO
console.log('\n3️⃣  GPIO:');
if (fs.existsSync('/sys/class/gpio')) {
  console.log('   ✅ GPIO filesystem access available');
} else {
  console.log('   ❌ GPIO filesystem NOT accessible');
}

// Check 4: I2C
console.log('\n4️⃣  I2C Bus (for LCD/future expansion):');
const i2cDevices = ['/dev/i2c-1', '/dev/i2c-0'];
let i2cFound = false;
for (const device of i2cDevices) {
  if (fs.existsSync(device)) {
    console.log(`   ✅ I2C available at ${device}`);
    i2cFound = true;
  }
}
if (!i2cFound) {
  console.log('   ⚠️  No I2C devices found (optional, not required for temperature sensors)');
}

// Check 5: Node.js Version
console.log('\n5️⃣  Node.js Version:');
console.log(`   ℹ️  Node.js ${process.version}`);

// Check 6: DS18x20 Module
console.log('\n6️⃣  DS18x20 NPM Module:');
try {
  const ds18Module = require('ds18x20');
  console.log('   ✅ ds18x20 module loaded successfully');
} catch (e) {
  console.log('   ❌ ds18x20 module failed to load:', e.message);
}

console.log('\n════════════════════════════════════════════════════════════════\n');

// Recommendations
console.log('📋 Recommendations:\n');
console.log('If sensors are NOT detected:');
console.log('  1. Enable 1-Wire: sudo raspi-config → Interfaces → 1-Wire');
console.log('  2. Add to /boot/config.txt: dtoverlay=w1-gpio,gpiopin=4');
console.log('  3. Reboot: sudo reboot');
console.log('  4. Verify sensor connections to GPIO4 (and GND, 3.3V)');
console.log('  5. Re-run this diagnostic script\n');

console.log('For testing without hardware:');
console.log('  SIMULATE=1 npm start\n');
