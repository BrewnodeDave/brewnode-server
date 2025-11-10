// Mock dependencies before requiring the module
jest.mock('../../src/broker.js', () => ({
  create: jest.fn(() => jest.fn())
}));
jest.mock('../../src/services/mysql-service.js', () => ({
  doublePublish: jest.fn()
}));

const publish = require('../../src/publish.js');

describe('Publish Module', () => {
  let broker;
  let mysqlService;

  beforeEach(() => {
    jest.clearAllMocks();
    broker = require('../../src/broker.js');
    mysqlService = require('../../src/services/mysql-service.js');
  });

  describe('module exports', () => {
    test('should export logPublish function', () => {
      expect(publish.logPublish).toBeDefined();
      expect(typeof publish.logPublish).toBe('function');
    });

    test('should export progressPublish function', () => {
      expect(publish.progressPublish).toBeDefined();
      expect(typeof publish.progressPublish).toBe('function');
    });

    test('should export remaining time functions', () => {
      expect(publish.remainingFillLitres).toBeDefined();
      expect(typeof publish.remainingFillLitres).toBe('function');
      
      expect(publish.remainingBoilMinutes).toBeDefined();
      expect(typeof publish.remainingBoilMinutes).toBe('function');
      
      expect(publish.remainingKettleMinutes).toBeDefined();
      expect(typeof publish.remainingKettleMinutes).toBe('function');
      
      expect(publish.remainingMashMinutes).toBeDefined();
      expect(typeof publish.remainingMashMinutes).toBe('function');
      
      expect(publish.remainingFermentDays).toBeDefined();
      expect(typeof publish.remainingFermentDays).toBe('function');
    });

    test('should export sensor publish functions', () => {
      expect(publish.temperaturePublish).toBeDefined();
      expect(typeof publish.temperaturePublish).toBe('function');
      
      expect(publish.pumpPublish).toBeDefined();
      expect(typeof publish.pumpPublish).toBe('function');
      
      expect(publish.valvePublish).toBeDefined();
      expect(typeof publish.valvePublish).toBe('function');
    });

    test('should export sensorPublish function', () => {
      expect(publish.sensorPublish).toBeDefined();
      expect(typeof publish.sensorPublish).toBe('function');
    });
  });

  describe('broker integration', () => {
    test('should create functions for all published events', () => {
      // Verify that all the exported functions are properly created
      expect(publish.logPublish).toBeDefined();
      expect(publish.progressPublish).toBeDefined();
      expect(publish.temperaturePublish).toBeDefined();
      expect(publish.pumpPublish).toBeDefined();
      expect(publish.valvePublish).toBeDefined();
      
      // Verify they are functions (created by the mocked broker.create)
      expect(typeof publish.logPublish).toBe('function');
      expect(typeof publish.progressPublish).toBe('function');
      expect(typeof publish.temperaturePublish).toBe('function');
      expect(typeof publish.pumpPublish).toBe('function');
      expect(typeof publish.valvePublish).toBe('function');
    });
  });

  describe('sensorPublish function', () => {
    test('should not publish when old and new values are the same', async () => {
      const sensorName = 'testSensor';
      const value = 'sameValue';
      
      await publish.sensorPublish(sensorName, value, value);
      
      expect(mysqlService.doublePublish).not.toHaveBeenCalled();
    });

    test('should publish when old and new values are different', async () => {
      const sensorName = 'testSensor';
      const oldValue = 'oldValue';
      const newValue = 'newValue';
      
      mysqlService.doublePublish.mockResolvedValue(undefined);
      
      await publish.sensorPublish(sensorName, oldValue, newValue);
      
      expect(mysqlService.doublePublish).toHaveBeenCalledWith(
        expect.any(Function),
        oldValue,
        newValue
      );
    });

    test('should pass correct parameters to doublePublish', async () => {
      const sensorName = 'temperatureSensor';
      const oldValue = 20.5;
      const newValue = 21.0;
      
      mysqlService.doublePublish.mockResolvedValue(undefined);
      
      await publish.sensorPublish(sensorName, oldValue, newValue);
      
      expect(mysqlService.doublePublish).toHaveBeenCalledTimes(1);
      const [publishFunction, passedOldValue, passedNewValue] = mysqlService.doublePublish.mock.calls[0];
      
      expect(typeof publishFunction).toBe('function');
      expect(passedOldValue).toBe(oldValue);
      expect(passedNewValue).toBe(newValue);
    });

    test('should handle async operation correctly', async () => {
      const sensorName = 'asyncSensor';
      const oldValue = 'old';
      const newValue = 'new';
      
      let resolvePromise;
      const asyncPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mysqlService.doublePublish.mockImplementation(() => asyncPromise);
      
      // Start the async operation
      const publishPromise = publish.sensorPublish(sensorName, oldValue, newValue);
      
      // Verify doublePublish was called
      expect(mysqlService.doublePublish).toHaveBeenCalled();
      
      // Resolve the promise to complete the operation
      resolvePromise();
      
      // Wait for the operation to complete
      await publishPromise;
      
      // Verify the operation completed successfully
      expect(mysqlService.doublePublish).toHaveBeenCalledWith(
        expect.any(Function),
        oldValue,
        newValue
      );
    });

    test('should handle different data types for values', async () => {
      const testCases = [
        ['string', 'old', 'new'],
        ['number', 1, 2],
        ['boolean', false, true],
        ['null', null, 'value'],
        ['undefined', undefined, 'value']
      ];
      
      mysqlService.doublePublish.mockResolvedValue(undefined);
      
      for (const [type, oldVal, newVal] of testCases) {
        await publish.sensorPublish(`test${type}`, oldVal, newVal);
        expect(mysqlService.doublePublish).toHaveBeenCalled();
        jest.clearAllMocks();
      }
    });

    test('should handle error in doublePublish', async () => {
      const sensorName = 'errorSensor';
      const oldValue = 'old';
      const newValue = 'new';
      const error = new Error('Database error');
      
      mysqlService.doublePublish.mockRejectedValue(error);
      
      await expect(publish.sensorPublish(sensorName, oldValue, newValue))
        .rejects.toThrow('Database error');
    });
  });

  describe('module initialization', () => {
    test('should initialize all publish functions on module load', () => {
      // Since the module is loaded, all functions should be available
      const publishFunctions = [
        'logPublish',
        'progressPublish',
        'remainingFillLitres',
        'remainingBoilMinutes',
        'remainingKettleMinutes',
        'remainingMashMinutes',
        'remainingFermentDays',
        'temperaturePublish',
        'pumpPublish',
        'valvePublish'
      ];
      
      publishFunctions.forEach(funcName => {
        expect(publish[funcName]).toBeDefined();
        expect(typeof publish[funcName]).toBe('function');
      });
    });
  });
});