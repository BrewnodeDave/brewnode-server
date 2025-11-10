const common = require('../../controllers/common.js');
const axios = require('axios');

// Mock axios
jest.mock('axios');

describe('Common Controller', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = {
      ...originalEnv,
      BREWFATHER_USERNAME: 'test_user',
      BREWFATHER_PASSWORD: 'test_pass'
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('getAuth function', () => {
    test('should return environment credentials when no authorization header', () => {
      const req = { headers: {} };
      const result = common.getAuth(req);
      
      expect(result).toEqual({
        username: 'test_user',
        password: 'test_pass'
      });
    });

    test('should return environment credentials when authorization header is undefined', () => {
      const req = { headers: { authorization: undefined } };
      const result = common.getAuth(req);
      
      expect(result).toEqual({
        username: 'test_user',
        password: 'test_pass'
      });
    });

    test('should parse basic auth credentials from authorization header', () => {
      const credentials = 'user123:pass456';
      const encoded = Buffer.from(credentials, 'ascii').toString('base64');
      const req = { 
        headers: { 
          authorization: `Basic ${encoded}` 
        } 
      };
      
      const result = common.getAuth(req);
      
      expect(result).toEqual({
        username: 'user123',
        password: 'pass456'
      });
    });

    test('should handle request with no headers', () => {
      const req = {};
      const result = common.getAuth(req);
      
      expect(result).toEqual({
        username: 'test_user',
        password: 'test_pass'
      });
    });

    test('should handle malformed authorization header', () => {
      const req = { 
        headers: { 
          authorization: 'Bearer token123' 
        } 
      };
      
      const result = common.getAuth(req);
      
      // With malformed auth, username might be the whole decoded string and password undefined
      expect(result.username).toBeDefined();
      // Password might be undefined if there's no colon in the decoded string
      expect(result.password).toBeUndefined();
    });
  });

  describe('HTTP methods', () => {
    beforeEach(() => {
      axios.get.mockResolvedValue({ data: 'test data' });
      axios.patch.mockResolvedValue({ data: 'updated data' });
    });

    describe('get method', () => {
      test('should make GET request with correct parameters', async () => {
        const req = { headers: {} };
        const endpoint = 'recipes';
        const params = { limit: 10 };

        await common.get(req, endpoint, params);

        expect(axios.get).toHaveBeenCalledWith(
          'https://api.brewfather.app/v2/recipes',
          {
            params: { limit: 10 },
            auth: { username: 'test_user', password: 'test_pass' }
          }
        );
      });

      test('should use custom auth from request headers', async () => {
        const credentials = 'custom:user';
        const encoded = Buffer.from(credentials, 'ascii').toString('base64');
        const req = { 
          headers: { 
            authorization: `Basic ${encoded}` 
          } 
        };
        const endpoint = 'batches';

        await common.get(req, endpoint, {});

        expect(axios.get).toHaveBeenCalledWith(
          'https://api.brewfather.app/v2/batches',
          {
            params: {},
            auth: { username: 'custom', password: 'user' }
          }
        );
      });

      test('should handle axios errors', async () => {
        const error = new Error('Network error');
        axios.get.mockRejectedValue(error);
        
        const req = { headers: {} };
        const result = await common.get(req, 'recipes', {});

        expect(result).toBe(error);
      });
    });

    describe('patch method', () => {
      test('should make PATCH request with correct parameters', async () => {
        const req = { headers: {} };
        const endpoint = 'batches/123';
        const params = { status: 'completed' };

        await common.patch(req, endpoint, params);

        expect(axios.patch).toHaveBeenCalledWith(
          'https://api.brewfather.app/v2/batches/123',
          {
            params: { status: 'completed' },
            auth: { username: 'test_user', password: 'test_pass' }
          }
        );
      });

      test('should handle axios errors', async () => {
        const error = new Error('Update failed');
        axios.patch.mockRejectedValue(error);
        
        const req = { headers: {} };
        const result = await common.patch(req, 'batches/123', {});

        expect(result).toBe(error);
      });
    });
  });

  describe('module exports', () => {
    test('should export all required functions and constants', () => {
      expect(common.getAuth).toBeInstanceOf(Function);
      expect(common.get).toBeInstanceOf(Function);
      expect(common.patch).toBeInstanceOf(Function);
      expect(common.brewfatherV2).toBe('https://api.brewfather.app/v2');
    });
  });

  describe('callAxios higher-order function', () => {
    test('should create function that handles axios calls with proper error handling', async () => {
      const mockAxiosMethod = jest.fn().mockRejectedValue(new Error('Test error'));
      const wrappedFunction = require('../../controllers/common.js');
      
      // Test that the internal callAxios function works correctly
      // by testing one of the exported functions which uses it
      const req = { headers: {} };
      axios.get.mockRejectedValue(new Error('Test error'));
      
      const result = await common.get(req, 'test', {});
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toBe('Test error');
    });
  });
});