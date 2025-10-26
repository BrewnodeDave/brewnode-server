const pumpService = require('../../src/services/pump-service.js');

// Mock dependencies
jest.mock('../../src/brewstack/common/brewdefs.js', () => ({
  MASH_PUMP_BIT: 0,
  KETTLE_PUMP_BIT: 1,
  GLYCOL_PUMP_BIT: 2
}));

jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

jest.mock('../../src/broker.js', () => ({
  pumpPublish: jest.fn(() => Promise.resolve()),
  getEmitFn: jest.fn(() => jest.fn()),
  create: jest.fn(() => jest.fn(() => Promise.resolve())),
  destroy: jest.fn()
}));

jest.mock('../../src/services/i2c_raspi-service.js', () => ({
  writeBit: jest.fn(),
  DIR_OUTPUT: 'output',
  init: jest.fn()
}));

jest.mock('../../src/services/mysql-service.js', () => ({
  doublePublish: jest.fn(() => Promise.resolve())
}));

const brewlog = require('../../src/brewstack/common/brewlog.js');
const broker = require('../../src/broker.js');
const i2c = require('../../src/services/i2c_raspi-service.js');
const { doublePublish } = require('../../src/services/mysql-service.js');

describe('Pump Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
    // Reset I2C mocks to default working state
    i2c.init.mockImplementation(() => {});
    i2c.writeBit.mockImplementation(() => {});
  });

  afterEach(() => {
    jest.useRealTimers();
    // Reset any mock implementations to prevent interference
    i2c.init.mockImplementation(() => {});
    i2c.writeBit.mockImplementation(() => {});
    try {
      pumpService.stop();
    } catch (e) {
      // Ignore errors in cleanup
    }
  });

  describe('initialization', () => {
    test('should start pump service successfully', async () => {
      const result = await pumpService.start(true);
      
      expect(result).toBe(true);
      expect(i2c.init).toHaveBeenCalledTimes(3); // For all three pumps
    });
  });

  describe('pump status', () => {
    test('should return pump status as array', async () => {
      // Start the pump service first to initialize the pumps
      await pumpService.start();
      
      const status = pumpService.getStatus();
      
      expect(Array.isArray(status)).toBe(true);
      expect(status.length).toBe(3);
      expect(status[0]).toHaveProperty('name');
      expect(status[0]).toHaveProperty('value');
    });
  });
});
