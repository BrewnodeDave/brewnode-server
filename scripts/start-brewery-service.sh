#!/bin/bash

# BrewNode Server Startup Script
# This script ensures I2C modules are loaded before starting the Node.js application

set -e

echo "🔧 BrewNode Server - Initializing hardware environment..."

# Check if we're on Raspberry Pi
if grep -q "Raspberry Pi" /proc/cpuinfo || grep -q "BCM" /proc/cpuinfo; then
    echo "📋 Raspberry Pi detected"
    
    # Load I2C kernel modules if not already loaded
    if ! lsmod | grep -q "i2c_dev"; then
        echo "🔗 Loading I2C kernel modules..."
        if command -v modprobe >/dev/null 2>&1; then
            modprobe i2c-dev 2>/dev/null || echo "⚠️  Failed to load i2c-dev module (may already be loaded)"
            modprobe i2c-bcm2835 2>/dev/null || echo "⚠️  Failed to load i2c-bcm2835 module (may already be loaded)"
        else
            echo "⚠️  modprobe not available - assuming I2C modules are pre-loaded"
        fi
    else
        echo "✅ I2C modules already loaded"
    fi
    
    # Check I2C device availability
    if [ -e /dev/i2c-1 ]; then
        echo "✅ I2C device /dev/i2c-1 available"
    elif [ -e /dev/i2c-0 ]; then
        echo "✅ I2C device /dev/i2c-0 available"
    else
        echo "⚠️  No I2C devices found - brewery hardware may not function"
    fi
    
    # Load OneWire modules for temperature sensors
    if ! lsmod | grep -q "w1_gpio"; then
        echo "🌡️  Loading OneWire modules..."
        if command -v modprobe >/dev/null 2>&1; then
            modprobe w1-gpio 2>/dev/null || echo "⚠️  Failed to load w1-gpio module"
            modprobe w1-therm 2>/dev/null || echo "⚠️  Failed to load w1-therm module"
        fi
    else
        echo "✅ OneWire modules already loaded"
    fi
    
else
    echo "ℹ️  Not running on Raspberry Pi - skipping hardware initialization"
fi

echo "🚀 Starting BrewNode Server..."

# Change to the application directory
cd "$(dirname "$0")/.."

# Start the Node.js application
exec node index.js