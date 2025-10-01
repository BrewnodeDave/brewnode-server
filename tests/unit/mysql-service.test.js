const mysqlService = require('../../src/services/mysql-service.js');

// Mock mysql dependency
jest.mock('mysql', () => ({
  createConnection: jest.fn(() => ({
    connect: jest.fn((callback) => callback ? callback(null) : Promise.resolve()),
    query: jest.fn((sql, params, callback) => {
      if (typeof params === 'function') {
        callback = params;
        params = [];
      }
      callback(null, [], []);
    }),
    end: jest.fn((callback) => callback ? callback() : Promise.resolve()),
    on: jest.fn((event, callback) => {
      // Mock event listener registration
      if (event === 'error') {
        // Don't call the error callback in normal tests
      }
    })
  }))
}));

describe('MySQL Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('session management', () => {
    test('should set and get session', () => {
      const brewName = 'TestBrew';
      
      mysqlService.setSession(brewName);
      const session = mysqlService.getSession();
      
      expect(session).toBe(brewName);
    });

    test('should default to "none" when no brew name provided', () => {
      mysqlService.setSession();
      const session = mysqlService.getSession();
      
      expect(session).toBe('none');
    });
  });

  describe('doublePublish', () => {
    test('should not publish when prev equals next', async () => {
      const mockPublish = jest.fn();
      const value = 'same';
      
      await mysqlService.doublePublish(mockPublish, value, value);
      
      expect(mockPublish).not.toHaveBeenCalled();
    });

    test('should publish twice when prev differs from next', async () => {
      const mockPublish = jest.fn().mockResolvedValue(true);
      const prev = 'old';
      const next = 'new';
      
      await mysqlService.doublePublish(mockPublish, prev, next);
      
      expect(mockPublish).toHaveBeenCalledTimes(2);
      expect(mockPublish).toHaveBeenCalledWith(prev, expect.any(Number));
      expect(mockPublish).toHaveBeenCalledWith(next, expect.any(Number));
    });

    test('should publish with different timestamps', async () => {
      const mockPublish = jest.fn().mockResolvedValue(true);
      const prev = 'old';
      const next = 'new';
      
      await mysqlService.doublePublish(mockPublish, prev, next);
      
      const calls = mockPublish.mock.calls;
      expect(calls[0][1]).toBe(calls[1][1] - 1);
    });
  });

  describe('sanitizeBrewName', () => {
    test('should replace special characters with underscores', () => {
      const result = mysqlService.sanitizeBrewName('Test-Brew!@#');
      expect(result).toBe('Test_Brew___');
    });

    test('should add underscore prefix if name starts with number', () => {
      const result = mysqlService.sanitizeBrewName('123Brew');
      expect(result).toBe('_123Brew');
    });

    test('should truncate to 64 characters', () => {
      const longName = 'a'.repeat(100);
      const result = mysqlService.sanitizeBrewName(longName);
      expect(result.length).toBe(64);
    });

    test('should allow letters, numbers, and underscores', () => {
      const result = mysqlService.sanitizeBrewName('Valid_Brew_123');
      expect(result).toBe('Valid_Brew_123');
    });
  });

  describe('deSanitizeBrewName', () => {
    test('should replace underscores with spaces', () => {
      const result = mysqlService.deSanitizeBrewName('Test_Brew_123');
      expect(result).toBe('Test Brew 123');
    });

    test('should trim whitespace', () => {
      const result = mysqlService.deSanitizeBrewName('_Test_Brew_');
      expect(result).toBe('Test Brew');
    });
  });

  describe('database connection', () => {
    test('should connect to database', async () => {
      const connection = await mysqlService.connect();
      
      expect(connection).toBeDefined();
    });

    test('should handle connection errors', async () => {
      const mysql = require('mysql');
      mysql.createConnection.mockReturnValueOnce({
        connect: jest.fn((callback) => callback(new Error('Connection failed'))),
        on: jest.fn(),
        query: jest.fn()
      });

      await expect(mysqlService.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('query execution', () => {
    test('should execute queries successfully', async () => {
      const connection = await mysqlService.connect();
      const sql = 'SELECT * FROM test_table';
      
      const result = await mysqlService.query(connection, sql);
      
      expect(result).toBeDefined();
    });

    test('should handle query parameters', async () => {
      const connection = await mysqlService.connect();
      const sql = 'SELECT * FROM test_table WHERE id = ?';
      const params = [1];
      
      const result = await mysqlService.query(connection, sql, params);
      
      expect(result).toBeDefined();
    });
  });
});
