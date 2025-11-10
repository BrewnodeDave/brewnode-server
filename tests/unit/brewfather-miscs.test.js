const brewfatherMiscs = require('../../controllers/brewfather-miscs.js');

// Mock the common module
jest.mock('../../controllers/common.js', () => ({
  get: jest.fn(),
  patch: jest.fn()
}));

const { get, patch } = require('../../controllers/common.js');

describe('Brewfather Miscs Controller', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn()
    };
    next = jest.fn();
  });

  describe('getMiscs', () => {
    test('should get miscs with all parameters', async () => {
      const mockResponse = {
        status: 200,
        data: [{ id: 1, name: 'Test Misc' }]
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.getMiscs(
        req, res, next,
        'include_param',
        true,
        true,
        10,
        'start_after_id',
        'name',
        'asc'
      );
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/miscs', {
        include: 'include_param',
        complete: true,
        inventory_exists: true,
        limit: 10,
        start_after: 'start_after_id',
        order_by: 'name',
        order_by_direction: 'asc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle undefined parameters', async () => {
      const mockResponse = {
        status: 200,
        data: []
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.getMiscs(req, res, next);
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/miscs', {
        include: undefined,
        complete: undefined,
        inventory_exists: undefined,
        limit: undefined,
        start_after: undefined,
        order_by: undefined,
        order_by_direction: undefined
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle different response statuses', async () => {
      const mockResponse = {
        status: 404,
        data: { error: 'Not found' }
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.getMiscs(req, res, next, 'test');
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });
  });

  describe('getMisc', () => {
    test('should get single misc by id', async () => {
      const mockResponse = {
        status: 200,
        data: { id: '123', name: 'Irish Moss' }
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.getMisc(req, res, next, 'inventory', '123');
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/miscs/123', {
        include: 'inventory'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle misc not found', async () => {
      const mockResponse = {
        status: 404,
        data: { error: 'Misc not found' }
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.getMisc(req, res, next, undefined, '999');
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/miscs/999', {
        include: undefined
      });
      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateMisc', () => {
    test('should update misc successfully', async () => {
      const mockResponse = {
        status: 200,
        data: { id: '123', inventory: 100 }
      };
      
      patch.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.updateMisc(req, res, next, '123', 10, 110);
      
      expect(patch).toHaveBeenCalledWith(req, 'inventory/miscs/123', {
        inventory_adjust: 10,
        inventory: 110,
        id: '123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' }
        }
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherMiscs.updateMisc(req, res, next, '123', 10, 110);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 60 seconds.');
    });

    test('should handle 429 rate limit error without retry-after header', async () => {
      const error = {
        response: {
          status: 429,
          headers: {}
        }
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherMiscs.updateMisc(req, res, next, '123', 10, 110);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 0 seconds.');
    });

    test('should handle other HTTP errors', async () => {
      const error = {
        response: {
          status: 400
        },
        message: 'Bad Request'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherMiscs.updateMisc(req, res, next, '123', 10, 110);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Bad Request');
    });

    test('should handle non-HTTP errors', async () => {
      const error = {
        message: 'Network error'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherMiscs.updateMisc(req, res, next, '123', 10, 110);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Network error');
    });

    test('should handle undefined parameters', async () => {
      const mockResponse = {
        status: 200,
        data: { id: '456' }
      };
      
      patch.mockResolvedValue(mockResponse);
      
      await brewfatherMiscs.updateMisc(req, res, next, '456');
      
      expect(patch).toHaveBeenCalledWith(req, 'inventory/miscs/456', {
        inventory_adjust: undefined,
        inventory: undefined,
        id: '456'
      });
    });
  });

  describe('module exports', () => {
    test('should export correct functions', () => {
      expect(brewfatherMiscs.getMisc).toBeDefined();
      expect(brewfatherMiscs.getMiscs).toBeDefined();
      expect(brewfatherMiscs.updateMisc).toBeDefined();
      
      expect(typeof brewfatherMiscs.getMisc).toBe('function');
      expect(typeof brewfatherMiscs.getMiscs).toBe('function');
      expect(typeof brewfatherMiscs.updateMisc).toBe('function');
    });
  });
});