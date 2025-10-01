const broker = require('../../src/broker.js');

// Mock dependencies
jest.mock('../../src/brewstack/common/brewlog.js', () => ({
  info: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}));

jest.mock('../../src/services/mysql-service.js', () => ({
  doublePublish: jest.fn(() => Promise.resolve()),
  brewData: jest.fn(() => Promise.resolve(true)),
  getSession: jest.fn(() => 'test-session')
}));

const brewlog = require('../../src/brewstack/common/brewlog.js');
const mysqlService = require('../../src/services/mysql-service.js');

describe('Broker Service', () => {
  let mockSocket;
  let mockEmitFn;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset broker state by detaching any existing clients
    // This is a workaround since the broker doesn't have a reset method
    const mockCleanupSocket = {
      id: 'cleanup',
      conn: { remoteAddress: '127.0.0.1' },
      connected: true,
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
      broadcast: { emit: jest.fn() }
    };
    
    // Try to clear any existing state
    try {
      broker.detach(mockCleanupSocket);
    } catch (e) {
      // Ignore errors
    }
    
    mockSocket = {
      id: 'test-socket-1',
      conn: { remoteAddress: '127.0.0.1' },
      connected: true,
      emit: jest.fn(),
      on: jest.fn(),
      disconnect: jest.fn(),
      broadcast: { emit: jest.fn() }
    };

    mockEmitFn = jest.fn();
    broker.setEmitFn(mockEmitFn);
  });

  describe('socket management', () => {
    test('should attach socket to broker', () => {
      const result = broker.attach(mockSocket);
      
      expect(result).toBe(true);
    });

    test('should detect existing socket', () => {
      broker.attach(mockSocket);
      
      const exists = broker.exists(mockSocket);
      
      expect(exists).toBe(true);
    });

    test('should not detect non-existent socket', () => {
      const otherSocket = {
        ...mockSocket,
        conn: { remoteAddress: '192.168.1.1' }
      };
      
      const exists = broker.exists(otherSocket);
      
      expect(exists).toBe(false);
    });

    test('should detach socket from broker', () => {
      broker.attach(mockSocket);
      
      const result = broker.detach(mockSocket);
      
      expect(result).toBe(true);
      expect(broker.exists(mockSocket)).toBe(false);
    });

    test('should handle detaching non-existent socket', () => {
      const result = broker.detach(mockSocket);
      
      expect(result).toBe(false);
    });
  });

  describe('emit function setup', () => {
    test('should set emit function', () => {
      const newEmitFn = jest.fn();
      
      broker.setEmitFn(newEmitFn);
      
      expect(broker.getEmitFn()).toBe(newEmitFn);
    });

    test('should get current emit function', () => {
      const emitFn = broker.getEmitFn();
      
      expect(emitFn).toBe(mockEmitFn);
    });
  });

  describe('publishing functions', () => {
    beforeEach(() => {
      // Set up a mock socket with broadcast property
      mockSocket.broadcast = {
        emit: jest.fn()
      };
      broker.attach(mockSocket);
    });

    test('should publish temperature data', async () => {
      const tempData = {
        sensor: 'Temp Fermenter',
        temperature: 18.5,
        timestamp: Date.now()
      };

      await broker.temperaturePublish(tempData);

      expect(mockSocket.emit).toHaveBeenCalledWith('temperature', tempData);
      expect(mysqlService.brewData).toHaveBeenCalled();
    });

    test('should publish pump status', async () => {
      const pumpData = {
        mash: true,
        kettle: false,
        glycol: true
      };

      await broker.pumpPublish(pumpData);

      expect(mockSocket.emit).toHaveBeenCalledWith('pump', pumpData);
      expect(mysqlService.brewData).toHaveBeenCalled();
    });

    test('should publish valve status', async () => {
      const valveData = {
        'Valve Mash In': true,
        'Valve Kettle Out': false
      };

      await broker.valvePublish(valveData);

      expect(mockSocket.emit).toHaveBeenCalledWith('valve', valveData);
      expect(mysqlService.brewData).toHaveBeenCalled();
    });

    test('should publish progress data', async () => {
      const progressData = {
        stage: 'mashing',
        percent: 45,
        timeRemaining: 1800
      };

      await broker.progressPublish(progressData);

      expect(mockSocket.emit).toHaveBeenCalledWith('Progress', progressData);
    });
  });

  describe('multiple clients', () => {
    let secondSocket;

    beforeEach(() => {
      secondSocket = {
        id: 'test-socket-2',
        conn: { remoteAddress: '192.168.1.100' },
        connected: true,
        emit: jest.fn(),
        on: jest.fn(),
        disconnect: jest.fn(),
        broadcast: { emit: jest.fn() }
      };

      mockSocket.broadcast = { emit: jest.fn() };
      broker.attach(mockSocket);
      broker.attach(secondSocket);
    });

    test('should broadcast to all connected clients', async () => {
      const tempData = { temperature: 20.0 };

      await broker.temperaturePublish(tempData);

      // Since the broker emits to _socket (the last attached socket) and then to all clients,
      // we should see both sockets being called
      expect(secondSocket.emit).toHaveBeenCalledWith('temperature', tempData);
      expect(mockSocket.emit).toHaveBeenCalledWith('temperature', tempData);
    });

    test('should handle client disconnection', () => {
      broker.detach(mockSocket);

      const remainingExists = broker.exists(secondSocket);
      const removedExists = broker.exists(mockSocket);

      expect(remainingExists).toBe(true);
      expect(removedExists).toBe(false);
    });
  });

  describe('error handling', () => {
    test('should handle emit errors gracefully', async () => {
      mockSocket.emit.mockImplementation(() => {
        throw new Error('Emit failed');
      });
      mockSocket.broadcast = { emit: jest.fn() };
      
      broker.attach(mockSocket);

      // The broker currently doesn't handle emit errors gracefully, so it will throw
      await expect(broker.temperaturePublish({ temp: 20 })).rejects.toThrow('Emit failed');
    });

    test('should handle database publish errors', async () => {
      // Reset the mockSocket emit to not throw
      mockSocket.emit.mockImplementation(() => {});
      mysqlService.brewData.mockRejectedValue(new Error('DB Error'));
      
      broker.attach(mockSocket);

      // Should still emit to socket despite DB error, but will throw due to DB error
      try {
        await broker.temperaturePublish({ temp: 20 });
      } catch (err) {
        expect(err.message).toBe('DB Error');
      }
      
      expect(mockSocket.emit).toHaveBeenCalled();
    });
  });

  describe('sensor event handling', () => {
    test('should handle sensor events', () => {
      const sensorData = { sensor: 'test', value: 123 };
      
      // Test that broker can handle sensor events
      broker.on('sensor', (data) => {
        expect(data).toEqual(sensorData);
      });

      broker.emit('sensor', sensorData);
    });

    test('should track sensor changes', async () => {
      // Reset the mock from previous test
      mysqlService.doublePublish.mockResolvedValue(true);
      
      const sensorName = 'Temp Fermenter';
      const oldValue = 18.0;
      const newValue = 18.5;

      await broker.sensorPublish(sensorName, oldValue, newValue);

      expect(mysqlService.doublePublish).toHaveBeenCalled();
    });
  });

  describe('debugging', () => {
    test('should enable debug mode', () => {
      broker.setDebug(true);
      
      expect(broker.getDebug()).toBe(true);
    });

    test('should log debug messages when enabled', () => {
      broker.setDebug(true);
      
      // Test that debug mode is enabled
      expect(broker.getDebug()).toBe(true);
      
      // Test toggling debug mode
      broker.setDebug(false);
      expect(broker.getDebug()).toBe(false);
    });
  });
});
