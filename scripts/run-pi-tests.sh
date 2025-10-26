#!/bin/bash

# BrewNode Raspberry Pi Hardware Test Runner
# This script helps run Pi-specific tests with proper setup

set -e

echo "🍺 BrewNode Pi Hardware Test Runner"
echo "=================================="

# Check if running on Raspberry Pi
if [[ ! -f /proc/cpuinfo ]] || ! grep -q "Raspberry Pi" /proc/cpuinfo; then
    echo "⚠️  This script should only be run on Raspberry Pi hardware"
    echo "   Regular tests can be run with: npm test"
    exit 1
fi

echo "✅ Raspberry Pi hardware detected"

# Check for required groups
if ! groups | grep -q gpio; then
    echo "❌ User not in 'gpio' group"
    echo "   Run: sudo usermod -a -G gpio $USER"
    echo "   Then logout and login again"
    exit 1
fi

if ! groups | grep -q i2c; then
    echo "❌ User not in 'i2c' group"  
    echo "   Run: sudo usermod -a -G i2c $USER"
    echo "   Then logout and login again"
    exit 1
fi

echo "✅ User has required permissions"

# Check hardware interfaces
echo "🔧 Checking hardware interfaces..."

if [[ ! -e /dev/i2c-1 ]]; then
    echo "⚠️  I2C interface not found - enabling I2C"
    echo "   Add 'dtparam=i2c_arm=on' to /boot/config.txt"
fi

if [[ ! -d /sys/bus/w1 ]]; then
    echo "⚠️  OneWire interface not found - enabling OneWire"
    echo "   Add 'dtoverlay=w1-gpio' to /boot/config.txt"
fi

# Parse command line arguments
TEST_TYPE="all"
COVERAGE=false
WATCH=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --coverage|-c)
            COVERAGE=true
            shift
            ;;
        --watch|-w)
            WATCH=true
            shift
            ;;
        --type|-t)
            TEST_TYPE="$2"
            shift 2
            ;;
        --help|-h)
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -c, --coverage    Run tests with coverage report"
            echo "  -w, --watch       Run tests in watch mode"
            echo "  -t, --type TYPE   Run specific test type (gpio|i2c|temp|all)"
            echo "  -h, --help        Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0                    # Run all Pi tests"
            echo "  $0 --coverage         # Run with coverage"
            echo "  $0 --type gpio        # Run only GPIO tests"
            echo "  $0 --watch            # Run in watch mode"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Build npm command
NPM_CMD="npm run"

if [[ "$WATCH" == true ]]; then
    NPM_CMD="${NPM_CMD} test:pi:watch"
elif [[ "$COVERAGE" == true ]]; then
    NPM_CMD="${NPM_CMD} test:pi:coverage"
else
    NPM_CMD="${NPM_CMD} test:pi"
fi

# Add test type filter if specified
if [[ "$TEST_TYPE" != "all" ]]; then
    NPM_CMD="${NPM_CMD} -- --testNamePattern='${TEST_TYPE}'"
fi

echo "🚀 Starting Pi hardware tests..."
echo "Command: $NPM_CMD"
echo ""

# Set environment variables for Pi testing
export BREWNODE_PI_TESTS=true
export NODE_ENV=test

# Run the tests
eval $NPM_CMD

echo ""
echo "✅ Pi hardware tests completed successfully!"