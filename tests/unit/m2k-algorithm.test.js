const m2k = require('../../src/brewstack/brewingAlgorithms/m2k.js');

// Mock the dependencies
jest.mock('../../src/services/pump-service.js', () => ({
  mashOnSync: jest.fn(),
  mashOffSync: jest.fn(),
  mashOn: jest.fn(() => Promise.resolve()),
  mashOff: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const pumps = require('../../src/services/pump-service.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

describe('M2K (Mash to Kettle) Algorithm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('transfer', () => {
    test('should transfer from mash to kettle synchronously', async () => {
      const options = {
        flowTimeoutSecs: 30,
        volume: 100
      };

      const result = await m2k.transfer(options);

      expect(brewlog.info).toHaveBeenCalledWith('Begin Mash-to-Kettle transfer ');
      expect(pumps.mashOnSync).toHaveBeenCalled();
      expect(pumps.mashOffSync).toHaveBeenCalled();
      expect(result).toEqual(options);
    });

    test('should handle transfer with different options', async () => {
      const options = {
        flowTimeoutSecs: 60,
        volume: 200
      };

      const result = await m2k.transfer(options);

      expect(result).toEqual(options);
      expect(pumps.mashOnSync).toHaveBeenCalledTimes(1);
      expect(pumps.mashOffSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('min', () => {
    test('should perform minimum transfer asynchronously', async () => {
      const options = {
        volume: 50
      };

      const result = await m2k.min(options);

      expect(brewlog.info).toHaveBeenCalledWith('Begin MINIMUM Mash-to-Kettle TRANSFER ');
      expect(pumps.mashOn).toHaveBeenCalled();
      expect(pumps.mashOff).toHaveBeenCalled();
      expect(result).toEqual(options);
    });

    test('should handle async pump operations', async () => {
      pumps.mashOn.mockResolvedValue(true);
      pumps.mashOff.mockResolvedValue(true);

      const options = { volume: 75 };
      const result = await m2k.min(options);

      expect(pumps.mashOn).toHaveBeenCalledTimes(1);
      expect(pumps.mashOff).toHaveBeenCalledTimes(1);
      expect(result).toEqual(options);
    });

    test('should handle pump errors gracefully', async () => {
      pumps.mashOn.mockRejectedValue(new Error('Pump error'));

      const options = { volume: 75 };

      await expect(m2k.min(options)).rejects.toThrow('Pump error');
      expect(pumps.mashOn).toHaveBeenCalled();
    });
  });
});
