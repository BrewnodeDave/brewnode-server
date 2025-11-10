const brewfatherFermentables = require('../../controllers/brewfather-fermentables.js');

// Mock the common module
jest.mock('../../controllers/common.js', () => ({
  get: jest.fn(),
  patch: jest.fn()
}));

const { get, patch } = require('../../controllers/common.js');

describe('Brewfather Fermentables Controller', () => {
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

  describe('getFermentables', () => {
    test('should get fermentables with all parameters', async () => {
      const mockResponse = {
        status: 200,
        data: [{ id: 1, name: 'Pilsner Malt' }]
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherFermentables.getFermentables(
        req, res, next,
        true,        // inventory_negative
        'include_param',
        true,        // complete
        true,        // inventory_exists
        10,          // limit
        'start_id',  // start_after
        'name',      // order_by
        'asc'        // order_by_direction
      );
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/fermentables', {
        inventory_negative: true,
        include: 'include_param',
        complete: true,
        inventory_exists: true,
        limit: 10,
        start_after: 'start_id',
        order_by: 'name',
        order_by_direction: 'asc'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle success response', async () => {
      const mockResponse = {
        status: 200,
        data: []
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherFermentables.getFermentables(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith([]);
    });

    test('should handle 429 rate limit error with retry-after header', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '120' }
        }
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherFermentables.getFermentables(req, res, next);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 120 seconds.');
    });

    test('should handle 429 rate limit error without retry-after header', async () => {
      const error = {
        response: {
          status: 429,
          headers: {}
        }
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherFermentables.getFermentables(req, res, next);
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 0 seconds.');
    });

    test('should handle other HTTP errors', async () => {
      const error = {
        response: {
          status: 404
        },
        message: 'Not Found'
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherFermentables.getFermentables(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith('Not Found');
    });

    test('should handle non-HTTP errors', async () => {
      const error = {
        message: 'Network timeout'
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherFermentables.getFermentables(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Network timeout');
    });
  });

  describe('getFermentable', () => {
    test('should get single fermentable by id', async () => {
      const mockResponse = {
        status: 200,
        data: { id: '123', name: 'Munich Malt' }
      };
      
      get.mockResolvedValue(mockResponse);
      
      await brewfatherFermentables.getFermentable(req, res, next, 'inventory', '123');
      
      expect(get).toHaveBeenCalledWith(req, 'inventory/fermentables/123', {
        include: 'inventory'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle 429 rate limit error', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '30' }
        }
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherFermentables.getFermentable(req, res, next, undefined, '999');
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 30 seconds.');
    });

    test('should handle other errors', async () => {
      const error = {
        response: {
          status: 403
        },
        message: 'Forbidden'
      };
      
      get.mockRejectedValue(error);
      
      await brewfatherFermentables.getFermentable(req, res, next, 'test', '456');
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.send).toHaveBeenCalledWith('Forbidden');
    });
  });

  describe('updateFermentable', () => {
    test('should update fermentable successfully', async () => {
      const mockResponse = {
        status: 200,
        data: { id: '123', inventory: 50.5 }
      };
      
      patch.mockResolvedValue(mockResponse);
      
      await brewfatherFermentables.updateFermentable(req, res, next, -5.5, 45, '123');
      
      expect(patch).toHaveBeenCalledWith(req, 'inventory/fermentables/123', {
        inventory_adjust: -5.5,
        inventory: 45,
        id: '123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockResponse.data);
    });

    test('should handle 429 rate limit error on update', async () => {
      const error = {
        response: {
          status: 429,
          headers: { 'retry-after': '90' }
        }
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherFermentables.updateFermentable(req, res, next, 10, 60, '456');
      
      expect(res.send).toHaveBeenCalledWith(429, 'Too many requests. Please retry after 90 seconds.');
    });

    test('should handle validation errors', async () => {
      const error = {
        response: {
          status: 400
        },
        message: 'Invalid inventory value'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherFermentables.updateFermentable(req, res, next, 'invalid', -1, '789');
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith('Invalid inventory value');
    });

    test('should handle network errors', async () => {
      const error = {
        message: 'Connection refused'
      };
      
      patch.mockRejectedValue(error);
      
      await brewfatherFermentables.updateFermentable(req, res, next, 0, 100, 'net-error');
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Connection refused');
    });
  });

  describe('module exports', () => {
    test('should export correct functions', () => {
      expect(brewfatherFermentables.getFermentable).toBeDefined();
      expect(brewfatherFermentables.getFermentables).toBeDefined();
      expect(brewfatherFermentables.updateFermentable).toBeDefined();
      
      expect(typeof brewfatherFermentables.getFermentable).toBe('function');
      expect(typeof brewfatherFermentables.getFermentables).toBe('function');
      expect(typeof brewfatherFermentables.updateFermentable).toBe('function');
    });
  });
});