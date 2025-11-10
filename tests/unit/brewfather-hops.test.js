const brewfatherHops = require('../../controllers/brewfather-hops.js');

// Mock the common module
jest.mock('../../controllers/common.js', () => ({
  get: jest.fn(),
  patch: jest.fn()
}));

const { get, patch } = require('../../controllers/common.js');

describe('Brewfather Hops Controller', () => {
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

  describe('getHops', () => {
    test('should get hops with all parameters', async () => {
      const mockResponse = {
        status: 200,
        data: [{ id: 1, name: 'Cascade', alpha: 5.5 }]
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherHops.getHops(
        req, res, next,
        'include_param',
        true,        // complete
        true,        // inventory_exists
        20,          // limit
        'start_hop', // start_after
        'alpha',     // order_by
        'desc'       // order_by_direction
      );
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/hops', {
        include: 'include_param',
        complete: true,
        inventory_exists: true,
        limit: 20,
        start_after: 'start_hop',
        order_by: 'alpha',
        order_by_direction: 'desc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle successful request without parameters', async () => {
      const mockResponse = {
        status: 200,
        data: []
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherHops.getHops(req, res, next);
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/hops', {
        include: undefined,
        complete: undefined,
        inventory_exists: undefined,
        limit: undefined,
        start_after: undefined,
        order_by: undefined,
        order_by_direction: undefined
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith([]);
    });

    test('should handle 429 rate limit error with retry-after', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '60' }
        }
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherHops.getHops(req, res, next);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 60 seconds.');
    });

    test('should handle 429 rate limit error without retry-after', async () => {
      const error = {
        response: {
          status: 429,
          headers: {}
        }
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherHops.getHops(req, res, next);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 0 seconds.');
    });

    test('should handle other HTTP errors', async () => {
      const error = {
        response: {
          status: 401
        },
        message: 'Unauthorized'
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherHops.getHops(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith('Unauthorized');
    });

    test('should handle network errors', async () => {
      const error = {
        message: 'Connection timeout'
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherHops.getHops(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Connection timeout');
    });
  });

  describe('getHop', () => {
    test('should get single hop by id', async () => {
      const mockResponse = {
        status: 200,
        data: { id: 'hop123', name: 'Centennial', alpha: 10.0 }
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherHops.getHop(req, res, next, 'hop123', 'inventory');
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/hops/hop123', {
        include: 'inventory'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should get hop without include parameter', async () => {
      const mockResponse = {
        status: 200,
        data: { id: 'hop456', name: 'Chinook' }
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherHops.getHop(req, res, next, 'hop456');
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/hops/hop456', {
        include: undefined
      });
    });

    test('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '45' }
        }
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherHops.getHop(req, res, next, 'hop789', 'test');
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 45 seconds.');
    });

    test('should handle not found error', async () => {
      const error = {
        response: {
          status: 404
        },
        message: 'Hop not found'
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherHops.getHop(req, res, next, 'nonexistent');
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Hop not found');
    });
  });

  describe('updateHop', () => {
    test('should update hop inventory successfully', async () => {
      const mockResponse = {
        status: 200,
        data: { id: 'hop123', inventory: 250 }
      };
      
      patch.mockResolvedValue(mockResponse);
      
      await brewfatherHops.updateHop(req, res, next, 'hop123', -50, 200);
      
      expect(patch).toHaveBeenCalledWith(req, 'inventory/hops/hop123', {
        inventory_adjust: -50,
        inventory: 200,
        id: 'hop123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle 429 rate limit error on update', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '75' }
        }
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherHops.updateHop(req, res, next, 'hop456', 100, 300);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 75 seconds.');
    });

    test('should handle validation errors', async () => {
      const error = {
        response: {
          status: 400
        },
        message: 'Invalid inventory adjustment'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherHops.updateHop(req, res, next, 'hop789', 'invalid', -10);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid inventory adjustment');
    });

    test('should handle server errors', async () => {
      const error = {
        response: {
          status: 500
        },
        message: 'Internal server error'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherHops.updateHop(req, res, next, 'hop999', 0, 0);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Internal server error');
    });

    test('should handle network errors without response', async () => {
      const error = {
        message: 'ECONNREFUSED'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherHops.updateHop(req, res, next, 'hop_net', 25, 75);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('ECONNREFUSED');
    });
  });

  describe('module exports', () => {
    test('should export correct functions', () => {
      expect(brewfatherHops.getHop).toBeDefined();
      expect(brewfatherHops.getHops).toBeDefined();
      expect(brewfatherHops.updateHop).toBeDefined();
      
      expect(typeof brewfatherHops.getHop).toBe('function');
      expect(typeof brewfatherHops.getHops).toBeDefined();
      expect(typeof brewfatherHops.updateHop).toBe('function');
    });
  });
});