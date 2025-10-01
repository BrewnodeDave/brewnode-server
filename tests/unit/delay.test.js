// Mock brewlog before requiring delay
jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn()
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
    const name = 'test-delay';
    
    const delayPromise = delay(delaySecs, name);
    
    // Fast-forward time
    jest.advanceTimersByTime(delaySecs * 1000);
    
    // The promise should resolve
    await expect(delayPromise).resolves.toBeUndefined();
  });

  test('should log delay start message', () => {
    const delaySecs = 2;
    const name = 'mash-step';
    
    delay(delaySecs, name);
    
    expect(brewlog.info).toHaveBeenCalledWith(
      expect.stringContaining(`${name} delay for`)
    );
  });

  test('should log progress updates during delay', () => {
    const delaySecs = 120; // 2 minutes
    const name = 'boil-step';
    
    delay(delaySecs, name);
    
    // Advance by report interval (60 seconds)
    jest.advanceTimersByTime(60 * 1000);
    
    expect(brewlog.info).toHaveBeenCalledWith(
      expect.stringContaining(`${name}:`)
    );
  });

  test('should not resolve before specified time', () => {
    const delaySecs = 2;
    let resolved = false;
    
    delay(delaySecs, 'test').then(() => {
      resolved = true;
    });
    
    // Advance time by less than delay
    jest.advanceTimersByTime((delaySecs - 1) * 1000);
    
    expect(resolved).toBe(false);
  });

  test('should resolve after specified time', async () => {
    const delaySecs = 1;
    let resolved = false;
    
    const delayPromise = delay(delaySecs, 'test').then(() => {
      resolved = true;
    });
    
    // Advance time by exact delay amount
    jest.advanceTimersByTime(delaySecs * 1000);
    
    await delayPromise;
    expect(resolved).toBe(true);
  });

  test('should handle zero delay', async () => {
    let resolved = false;
    
    const delayPromise = delay(0, 'instant').then(() => {
      resolved = true;
    });
    
    jest.advanceTimersByTime(0);
    
    await delayPromise;
    expect(resolved).toBe(true);
  });

  test('should calculate minutes correctly', () => {
    const delaySecs = 90; // 1.5 minutes
    const name = 'test-step';
    
    delay(delaySecs, name);
    
    // Should log "2 mins" (ceiling of 1.5)
    expect(brewlog.info).toHaveBeenCalledWith(
      expect.stringContaining('2 mins')
    );
  });

  test('should clear interval when delay completes', async () => {
    const delaySecs = 1;
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    
    const delayPromise = delay(delaySecs, 'test');
    
    jest.advanceTimersByTime(delaySecs * 1000);
    
    await delayPromise;
    
    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
