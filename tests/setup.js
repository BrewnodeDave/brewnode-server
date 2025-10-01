// Test setup file
require('dotenv').config({ path: '.env.test' });

// Mock hardware dependencies that may not be available in test environment
// These mocks prevent Jest from trying to import actual hardware modules
jest.doMock('raspi', () => ({
  init: jest.fn(() => Promise.resolve()),
}), { virtual: true });

jest.doMock('raspi-i2c', () => ({
  I2C: jest.fn().mockImplementation(() => ({
    writeSync: jest.fn(),
    readSync: jest.fn(),
  })),
}), { virtual: true });

jest.doMock('@iiot2k/ds18b20', () => ({
  read_sensor: jest.fn((pin, fahrenheit, callback) => {
    setTimeout(() => callback([{ id: 'sensor1', value: 20.5 }]), 10);
  }),
  read_sensor_sync: jest.fn(() => [{ id: 'sensor1', value: 20.5 }]),
  read_one_sensor_sync: jest.fn(() => ({ id: 'sensor1', value: 20.5 })),
  list_sensor: jest.fn(() => ['sensor1']),
  sensors: jest.fn(() => ['sensor1']),
  get: jest.fn(() => ({ temp: 20.5, valid: true })),
}), { virtual: true });

jest.doMock('ds18x20', () => ({
  list: jest.fn(() => Promise.resolve([])),
  get: jest.fn(() => Promise.resolve({ temp: 20.5 })),
}), { virtual: true });

// Mock the simulation DS18B20 module as well
jest.doMock('../src/sim/ds18b20', () => ({
  read_sensor: jest.fn((pin, fahrenheit, callback) => {
    setTimeout(() => callback([20.5, 21.2]), 10); // Return array of numbers
  }),
  read_sensor_sync: jest.fn(() => [20.5, 21.2]), // Return array of numbers
  read_one_sensor_sync: jest.fn(() => 20.5), // Return single number
  list_sensor: jest.fn(() => ['sensor1', 'sensor2']),
  set: jest.fn(),
}), { virtual: true });

// Global test utilities
global.mockTemperatureReading = (temp = 20.5) => ({
  temp,
  valid: true,
  timestamp: Date.now()
});

global.mockSensorData = {
  temperature: 20.5,
  pressure: 1.013,
  humidity: 65
};

// Suppress console logs during tests unless debugging
if (!process.env.DEBUG_TESTS) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
