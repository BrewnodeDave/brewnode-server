#!/bin/bash

# Test runner script for BrewNode Server
# This script runs different types of tests with proper setup

set -e

echo "🧪 BrewNode Server Test Suite"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${2}${1}${NC}"
}

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..." $YELLOW
    npm install
fi

# Set test environment
export NODE_ENV=test

# Parse command line arguments
TEST_TYPE="${1:-all}"

case $TEST_TYPE in
    "unit")
        print_status "Running unit tests only..." $YELLOW
        npm test -- tests/unit/
        ;;
    "integration")
        print_status "Running integration tests only..." $YELLOW
        npm test -- tests/integration/
        ;;
    "coverage")
        print_status "Running tests with coverage report..." $YELLOW
        npm run test:coverage
        ;;
    "watch")
        print_status "Running tests in watch mode..." $YELLOW
        npm run test:watch
        ;;
    "all"|*)
        print_status "Running all tests..." $YELLOW
        
        # Run unit tests first
        print_status "Running unit tests..." $YELLOW
        npm test -- tests/unit/
        
        # Run integration tests
        print_status "Running integration tests..." $YELLOW
        npm test -- tests/integration/
        
        print_status "All tests completed!" $GREEN
        ;;
esac

exit_code=$?

if [ $exit_code -eq 0 ]; then
    print_status "✅ Tests passed successfully!" $GREEN
else
    print_status "❌ Some tests failed!" $RED
    exit $exit_code
fi
