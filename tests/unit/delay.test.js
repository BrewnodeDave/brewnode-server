// Mock brewlog before requiring delay
jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

const delay = require('../../src/brewstack/common/delay.js');
const brewlog = require('../../src/brewstack/common/brewlog.js');

describe('Delay Utility', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should create delay for specified seconds', async () => {
    const delaySecs = 1; // 1 second
    
    const delayPromise = delay(delaySecs);
    
    // Fast-forward time
    jest.advanceTimersByTime(delaySecs * 1000);
    
    // The promise should resolve
    await expect(delayPromise).resolves.toBeUndefined();
  });

  test('should log delay start message', () => {
    const delaySecs = 120;
    const cb = jest.fn();
    
    delay(delaySecs, cb);
    
    // Advance by report interval (60 seconds)
    jest.advanceTimersByTime(60 * 1000);
    
    expect(cb).toHaveBeenCalledWith(
      expect.stringContaining('mins to go')
    );
  });

  test('should log progress updates during delay', () => {
    const delaySecs = 120; // 2 minutes
    const cb = jest.fn();
    
    delay(delaySecs, cb);
    
    // Advance by report interval (60 seconds)
    jest.advanceTimersByTime(60 * 1000);
    
    expect(cb).toHaveBeenCalledWith(
      expect.stringContaining('mins to go')
    );
  });

  test('should not resolve before specified time', () => {
    const delaySecs = 2;
    let resolved = false;
    
    delay(delaySecs).then(() => {
      resolved = true;
    });
    
    // Advance time by less than delay
    jest.advanceTimersByTime((delaySecs - 1) * 1000);
    
    expect(resolved).toBe(false);
  });

  test('should resolve after specified time', async () => {
    const delaySecs = 1;
    let resolved = false;
    
    const delayPromise = delay(delaySecs).then(() => {
      resolved = true;
    });
    
    // Advance time by exact delay amount
    jest.advanceTimersByTime(delaySecs * 1000);
    
    await delayPromise;
    expect(resolved).toBe(true);
  });

  test('should handle zero delay', async () => {
    let resolved = false;
    
    const delayPromise = delay(0).then(() => {
      resolved = true;
    });
    
    jest.advanceTimersByTime(0);
    
    await delayPromise;
    expect(resolved).toBe(true);
  });

  test('should calculate minutes correctly', () => {
    const delaySecs = 90; // 1.5 minutes
    const cb = jest.fn();
    
    delay(delaySecs, cb);
    
    // Advance by 60s — toGoSecs becomes 30s, ceil(30/60) = 1 min
    jest.advanceTimersByTime(60 * 1000);
    
    expect(cb).toHaveBeenCalledWith(
      expect.stringContaining('1 mins to go')
    );
  });

  test('should clear interval when delay completes', async () => {
    const delaySecs = 1;
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const delayPromise = delay(delaySecs);
    
    jest.advanceTimersByTime(delaySecs * 1000);
    
    await delayPromise;
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
