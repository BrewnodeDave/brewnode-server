/**
 * Jest Configuration for Raspberry Pi Hardware Tests
 * 
 * This configuration is optimized for testing real hardware on Pi.
 * It includes longer timeouts and hardware-specific setup.
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns for Pi hardware tests
  testMatch: [
    '**/tests/hardware/**/*.test.js'
  ],
  
  // Longer timeouts for hardware operations
  testTimeout: 30000,
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/hardware/setup-pi-tests.js'
  ],
  
  // Coverage configuration for hardware services
  collectCoverageFrom: [
    'src/services/*-service.js',
    '!src/services/*.test.js',
    '!src/services/mysql-service.js', // Skip DB service in hardware tests
    '!src/sim/**' // Skip simulation in hardware tests
  ],
  
  // Coverage thresholds for hardware code
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    'src/services/i2c_raspi-service.js': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Verbose output for hardware debugging
  verbose: true,
  
  // Hardware-specific globals
  globals: {
    'PI_HARDWARE_TESTS': true,
    'I2C_BUS': 1,
    'GPIO_BASE': '/sys/class/gpio',
    'ONEWIRE_BASE': '/sys/bus/w1/devices'
  },
  
  // Module name mapping for Pi-specific modules
  moduleNameMapper: {
    '^raspi-i2c$': '<rootDir>/src/services/i2c_raspi-service.js'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Test result processors (using built-in reporters only)
  reporters: ['default'],
  
  // Hardware test categories as test suites
  projects: [
    {
      displayName: 'GPIO Tests',
      testMatch: ['**/tests/hardware/*gpio*.test.js']
    },
    {
      displayName: 'I2C Tests', 
      testMatch: ['**/tests/hardware/*i2c*.test.js']
    },
    {
      displayName: 'Temperature Tests',
      testMatch: ['**/tests/hardware/*temp*.test.js']
    },
    {
      displayName: 'Integration Tests',
      testMatch: ['**/tests/hardware/pi-hardware.test.js']
    }
  ]
};