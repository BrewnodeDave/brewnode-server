const k2f = require('../../src/brewstack/brewingAlgorithms/k2f.js');

// Mock the dependencies
jest.mock('../../src/services/valve-service.js', () => ({
  open: jest.fn(),
  close: jest.fn(),
}));

jest.mock('../../src/services/pump-service.js', () => ({
  kettleOnSync: jest.fn(),
  kettleOffSync: jest.fn(),
}));

jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

const valves = require('../../src/services/valve-service.js');
const pumps = require('../../src/services/pump-service.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

describe('K2F (Kettle to Ferment) Algorithm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('start', () => {
    test('should start the K2F process', () => {
      const volume = 100;
      
      k2f.start(volume);
      
      expect(brewlog.info).toHaveBeenCalledWith(
        expect.stringContaining('start'),
        expect.stringContaining(volume.toString())
      );
    });

    test('should handle zero volume', () => {
      k2f.start(0);
      
      expect(brewlog.info).toHaveBeenCalled();
    });
  });

  describe('stop', () => {
    test('should stop the K2F process', () => {
      k2f.stop();
      
      expect(brewlog.info).toHaveBeenCalledWith(
        expect.stringContaining('stop'),
        expect.any(String)
      );
    });
  });

  describe('modulation process', () => {
    test('should modulate valves and pumps correctly', () => {
      k2f.start(100);
      
      // Fast-forward through the first interval
      jest.advanceTimersByTime(10000);
      
      expect(valves.open).toHaveBeenCalledWith('Valve Chiller wort-out');
      expect(valves.open).toHaveBeenCalledWith('Valve Chiller wort-in');
      expect(pumps.kettleOffSync).toHaveBeenCalled();
      
      // Fast-forward to the timeout within the interval
      jest.advanceTimersByTime(4500);
      
      expect(valves.close).toHaveBeenCalledWith('Valve Chiller wort-out');
      expect(pumps.kettleOnSync).toHaveBeenCalled();
    });
  });

  describe('getStatus', () => {
    test('should return current status', () => {
      const status = k2f.getStatus();
      
      expect(status).toHaveProperty('running');
      expect(typeof status.running).toBe('boolean');
    });
  });
});
