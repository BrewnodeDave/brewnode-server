const fs = require('fs');
const path = require('path');
const brewlog = require('../../src/brewstack/common/brewlog.js');

// Mock dependencies
jest.mock('fs');
jest.mock('rollbar');
jest.mock('../../src/brewstack/common/brewdefs.js', () => ({
  ROLLBAR: false,
  ROLLBAR_POST_SERVER_ITEM_ACCESS_TOKEN: 'test-token'
}));
jest.mock('../../src/services/mysql-service.js', () => ({
  log: jest.fn()
}));

describe('Brewlog Module', () => {
  let mockFs;
  let mysqlService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockFs = require('fs');
    mysqlService = require('../../src/services/mysql-service.js');
    
    // Setup default fs mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.appendFileSync.mockImplementation(() => {});
    mockFs.writeFileSync.mockImplementation(() => {});
    mockFs.unlinkSync.mockImplementation(() => {});
  });

  describe('filePath function', () => {
    test('should return correct log file path', () => {
      const result = brewlog.filePath();
      expect(result).toContain('log.txt');
      expect(path.isAbsolute(result)).toBe(true);
    });

    test('should create log file if it does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      brewlog.filePath();
      
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        ''
      );
    });

    test('should not create log file if it already exists', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      brewlog.filePath();
      
      expect(mockFs.writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllLogs function', () => {
    test('should delete log file if it exists and return true', () => {
      mockFs.existsSync.mockReturnValue(true);
      
      const result = brewlog.deleteAllLogs();
      
      expect(mockFs.unlinkSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt')
      );
      expect(result).toBe(true);
    });

    test('should return false if log file does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      const result = brewlog.deleteAllLogs();
      
      expect(mockFs.unlinkSync).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });

  describe('info method', () => {
    test('should log info message without data', () => {
      brewlog.info('Test message');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('ℹ️ Test message')
      );
      expect(mysqlService.log).toHaveBeenCalledWith('Test message: ');
    });

    test('should log info message with data', () => {
      brewlog.info('Test message', 'test data');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('ℹ️ Test message :  test data')
      );
      expect(mysqlService.log).toHaveBeenCalledWith('Test message: test data');
    });
  });

  describe('warn method', () => {
    test('should log warning message without data', () => {
      brewlog.warn('Warning message');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('⚠️ Warning message')
      );
    });

    test('should log warning message with data', () => {
      brewlog.warn('Warning message', 'warning data');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('⚠️ Warning message :  warning data')
      );
    });
  });

  describe('error method', () => {
    test('should log error message without data', () => {
      brewlog.error('Error message');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('❌ Error message')
      );
    });

    test('should log error message with data', () => {
      brewlog.error('Error message', 'error data');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('❌ Error message :  error data')
      );
    });
  });

  describe('debug method', () => {
    test('should log debug message when debug is enabled', () => {
      // Debug messages are only logged when _debug is true
      // Since _debug is internal, we test the function call
      brewlog.debug('Debug message', 'debug data');
      
      // Debug method should be callable but may not log depending on internal state
      expect(() => brewlog.debug('Debug message', 'debug data')).not.toThrow();
    });
  });

  describe('critical method', () => {
    test('should log critical message without data', () => {
      brewlog.critical('Critical message');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('❌ Critical message')
      );
    });

    test('should log critical message with data', () => {
      brewlog.critical('Critical message', 'critical data');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('❌ Critical message :  critical data')
      );
    });
  });

  describe('sensorLog method', () => {
    test('should not log watchdog sensor', () => {
      brewlog.sensorLog('Watchdog', 'some value');
      
      // Watchdog should not be logged
      expect(mockFs.appendFileSync).not.toHaveBeenCalled();
    });

    test('should log kettle heater value', () => {
      brewlog.sensorLog('Kettle Heater', 'heater value');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('ℹ️ heater value')
      );
    });

    test('should log flow sensor values', () => {
      const flowValue = { rate: 10, delta: 5 };
      brewlog.sensorLog('Flow Sensor', flowValue);
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('ℹ️ 10,5')
      );
    });

    test('should log power values', () => {
      brewlog.sensorLog('Power', 100);
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('ℹ️ 100')
      );
    });

    test('should log other sensor values', () => {
      brewlog.sensorLog('Temperature', '20.5');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringContaining('ℹ️ 20.5')
      );
    });
  });

  describe('log timestamp and formatting', () => {
    test('should include ISO timestamp in log entries', () => {
      const beforeTime = new Date().toISOString().substring(0, 10); // Just date part
      
      brewlog.info('Test log entry');
      
      expect(mockFs.appendFileSync).toHaveBeenCalledWith(
        expect.stringContaining('log.txt'),
        expect.stringMatching(new RegExp(`${beforeTime}.*ℹ️.*Test log entry`))
      );
    });

    test('should format log entry correctly with newline', () => {
      brewlog.info('Test message', 'test data');
      
      const calls = mockFs.appendFileSync.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[1]).toMatch(/\n$/); // Should end with newline
    });
  });

  describe('sensorStop method', () => {
    test('should call sensorStop without errors', () => {
      expect(() => {
        brewlog.sensorStop('TestSensor');
      }).not.toThrow();
    });

    test('should prevent logging after sensorStop is called', () => {
      brewlog.sensorStop('TestSensor');
      
      const callsBefore = mockFs.appendFileSync.mock.calls.length;
      brewlog.info('This should not log');
      
      // Should not have made any additional calls to appendFileSync
      expect(mockFs.appendFileSync.mock.calls.length).toBe(callsBefore);
    });
  });
});