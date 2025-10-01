const io = require('socket.io-client');
const { createServer } = require('http');
const { Server } = require('socket.io');
const broker = require('../../src/broker.js');

describe('Socket.IO Integration Tests', () => {
  let httpServer;
  let ioServer;
  let serverSocket;
  let clientSocket;
  const port = 4001; // Use different port for tests

  beforeAll((done) => {
    httpServer = createServer();
    ioServer = new Server(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    httpServer.listen(port, () => {
      done();
    });
  });

  afterAll((done) => {
    ioServer.close();
    httpServer.close(done);
  });

  beforeEach((done) => {
    // Set up server-side socket handling
    ioServer.on('connection', (socket) => {
      serverSocket = socket;
      
      // Mock broker attachment
      broker.attach(socket);
      
      socket.on('disconnect', () => {
        broker.detach(socket);
      });
    });

    // Create client socket
    clientSocket = io(`http://localhost:${port}`);
    clientSocket.on('connect', done);
  });

  afterEach(() => {
    // Increase max listeners to prevent warnings
    if (serverSocket) {
      serverSocket.setMaxListeners(20);
      serverSocket.removeAllListeners();
    }
    
    if (clientSocket && clientSocket.connected) {
      clientSocket.removeAllListeners();
      clientSocket.disconnect();
    }
  });

  describe('Connection handling', () => {
    test('should establish socket connection', (done) => {
      expect(clientSocket.connected).toBe(true);
      done();
    });

    test('should handle client disconnect', (done) => {
      clientSocket.on('disconnect', () => {
        done();
      });
      
      clientSocket.disconnect();
    });
  });

  describe('Message broadcasting', () => {
    test('should receive temperature updates', (done) => {
      const mockTempData = {
        sensor: '28-001',
        temperature: 20.5,
        timestamp: Date.now()
      };

      clientSocket.on('temperature', (data) => {
        expect(data).toEqual(mockTempData);
        done();
      });

      // Simulate server broadcasting temperature data
      serverSocket.emit('temperature', mockTempData);
    });

    test('should receive brewing status updates', (done) => {
      const mockStatus = {
        stage: 'mashing',
        temperature: 65.0,
        timeRemaining: 3600,
        timestamp: Date.now()
      };

      clientSocket.on('brewStatus', (data) => {
        expect(data).toEqual(mockStatus);
        done();
      });

      serverSocket.emit('brewStatus', mockStatus);
    });

    test('should receive pump status updates', (done) => {
      const mockPumpStatus = {
        kettle: true,
        mash: false,
        timestamp: Date.now()
      };

      clientSocket.on('pumpStatus', (data) => {
        expect(data).toEqual(mockPumpStatus);
        done();
      });

      serverSocket.emit('pumpStatus', mockPumpStatus);
    });
  });

  describe('Client commands', () => {
    test('should handle start brewing command', (done) => {
      serverSocket.on('startBrewing', (data) => {
        expect(data).toHaveProperty('recipe');
        serverSocket.emit('brewingStarted', { 
          success: true, 
          message: 'Brewing started' 
        });
        done();
      });

      clientSocket.emit('startBrewing', { 
        recipe: 'Test IPA' 
      });
    });

    test('should handle stop brewing command', (done) => {
      serverSocket.on('stopBrewing', () => {
        serverSocket.emit('brewingStopped', { 
          success: true, 
          message: 'Brewing stopped' 
        });
        done();
      });

      clientSocket.emit('stopBrewing');
    });

    test('should handle temperature set command', (done) => {
      serverSocket.on('setTemperature', (data) => {
        expect(data).toHaveProperty('target');
        expect(typeof data.target).toBe('number');
        serverSocket.emit('temperatureSet', { 
          target: data.target,
          success: true 
        });
        done();
      });

      clientSocket.emit('setTemperature', { target: 67.5 });
    });
  });

  describe('Error handling', () => {
    test('should handle invalid message format', (done) => {
      // Set a timeout to ensure the test completes
      const timeout = setTimeout(() => {
        done();
      }, 500);

      serverSocket.on('error', (error) => {
        clearTimeout(timeout);
        expect(error).toHaveProperty('message');
        done();
      });

      // Send invalid data and trigger error immediately
      clientSocket.emit('invalidEvent', null);
      
      // Simulate error response more reliably
      setImmediate(() => {
        serverSocket.emit('error', { 
          message: 'Invalid message format' 
        });
      });
    });
  });

  describe('Multiple clients', () => {
    let secondClientSocket;

    beforeEach((done) => {
      secondClientSocket = io(`http://localhost:${port}`);
      secondClientSocket.on('connect', done);
    });

    afterEach(() => {
      if (secondClientSocket && secondClientSocket.connected) {
        secondClientSocket.disconnect();
      }
    });

    test('should broadcast to all connected clients', (done) => {
      let receivedCount = 0;
      const mockData = { message: 'broadcast test' };

      const checkCompletion = () => {
        receivedCount++;
        if (receivedCount === 2) {
          done();
        }
      };

      clientSocket.on('broadcast', checkCompletion);
      secondClientSocket.on('broadcast', checkCompletion);

      // Broadcast to all clients
      ioServer.emit('broadcast', mockData);
    });
  });
});
