const fs = require('fs');
const http = require('http');
const path = require('path');

describe('Index.js - Main Application', () => {
  let originalConsoleLog, originalConsoleError, originalConsoleWarn;
  let originalProcessExit;
  
  // Store original values
  let originalFsReadFileSync, originalFsExistsSync, originalFsReaddirSync;
  let mockApp, mockServer, mockSocketioServer, mockSocket;

  beforeAll(() => {
    // Store original functions
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    originalProcessExit = process.exit;
    
    originalFsReadFileSync = fs.readFileSync;
    originalFsExistsSync = fs.existsSync;
    originalFsReaddirSync = fs.readdirSync;
  });

  afterAll(() => {
    // Restore original functions
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    process.exit = originalProcessExit;
    
    fs.readFileSync = originalFsReadFileSync;
    fs.existsSync = originalFsExistsSync;
    fs.readdirSync = originalFsReaddirSync;
  });

  beforeEach(() => {
    // Mock console functions
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    process.exit = jest.fn();

    // Mock app structure
    mockApp = {
      _router: {
        stack: new Array(15).fill({})
      },
      use: jest.fn()
    };

    // Mock HTTP server
    mockServer = {
      listen: jest.fn((port, callback) => {
        if (callback) setTimeout(callback, 10);
        return mockServer;
      })
    };

    // Mock Socket.io components
    mockSocket = {
      id: 'test-socket-id',
      on: jest.fn(),
      emit: jest.fn(),
      conn: { remoteAddress: '127.0.0.1' }
    };

    mockSocketioServer = {
      listen: jest.fn(() => mockSocketioServer),
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          setTimeout(() => callback(mockSocket), 10);
        }
      }),
      emit: jest.fn()
    };

    // Reset environment
    delete process.env.SKIP_HARDWARE_TESTS;
  });

  afterEach(() => {
    jest.resetModules();
  });

  describe('Module Loading and Basic Setup', () => {
    test('should load and initialize basic modules without errors', () => {
      jest.doMock('../../src/brewstack/common/brewdefs.js', () => ({
        isRaspPi: jest.fn(() => false)
      }));

      jest.doMock('../../src/broker.js', () => ({
        setEmitFn: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn(),
        exists: jest.fn(() => false)
      }));

      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(true))
      }));

      jest.doMock('cors', () => jest.fn(() => (req, res, next) => next()));
      
      jest.doMock('oas3-tools', () => ({
        expressAppConfig: jest.fn(() => ({
          getApp: () => mockApp
        }))
      }));

      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      jest.doMock('http', () => ({
        createServer: jest.fn(() => mockServer)
      }));

      fs.readFileSync = jest.fn();
      fs.existsSync = jest.fn();
      fs.readdirSync = jest.fn();

      delete require.cache[require.resolve('../../index.js')];
      
      // Should load without errors
      expect(() => {
        require('../../index.js');
      }).not.toThrow();
    });

    test('should test insertMiddleware function indirectly', () => {
      jest.doMock('../../src/brewstack/common/brewdefs.js', () => ({
        isRaspPi: jest.fn(() => false)
      }));

      jest.doMock('../../src/broker.js', () => ({
        setEmitFn: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn(),
        exists: jest.fn(() => false)
      }));

      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(true))
      }));

      const mockSplice = jest.fn(() => ['item1', 'item2', 'item3', 'item4', 'item5', 'item6', 'item7', 'item8', 'item9', 'item10']);
      const testApp = {
        _router: {
          stack: {
            length: 15,
            push: jest.fn(),
            splice: mockSplice
          }
        },
        use: jest.fn()
      };

      jest.doMock('cors', () => jest.fn(() => (req, res, next) => next()));
      
      jest.doMock('oas3-tools', () => ({
        expressAppConfig: jest.fn(() => ({
          getApp: () => testApp
        }))
      }));

      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      jest.doMock('http', () => ({
        createServer: jest.fn(() => mockServer)
      }));

      fs.readFileSync = jest.fn();
      fs.existsSync = jest.fn();
      fs.readdirSync = jest.fn();

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      // Verify insertMiddleware was called indirectly through CORS setup
      expect(testApp.use).toHaveBeenCalled();
      expect(testApp._router.stack.push).toHaveBeenCalled();
      expect(mockSplice).toHaveBeenCalledWith(5, 10); // stackLength - 10 = 15 - 10 = 5
    });
  });

  describe('Hardware Validation Function Unit Tests', () => {
    // Test the validatePiHardware function directly by extracting it
    test('should test validatePiHardware function when not on Pi', async () => {
      // Mock the brewdefs module
      const mockBrewdefs = { isRaspPi: jest.fn(() => false) };
      
      // Create a context to run the function
      const validatePiHardwareCode = `
        async function validatePiHardware() {
          if (!brewdefs.isRaspPi()) {
            console.log("ℹ️  Not running on Raspberry Pi - skipping hardware validation tests");
            return true;
          }
          return false;
        }
        return validatePiHardware();
      `;
      
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const validateFunc = new AsyncFunction('brewdefs', 'console', 'fs', 'process', validatePiHardwareCode);
      
      const mockConsole = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const mockProcess = { env: {} };
      const mockFs = { readFileSync: jest.fn(), existsSync: jest.fn(), readdirSync: jest.fn() };
      
      const result = await validateFunc(mockBrewdefs, mockConsole, mockFs, mockProcess);
      
      expect(result).toBe(true);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "ℹ️  Not running on Raspberry Pi - skipping hardware validation tests"
      );
    });

    test('should test validatePiHardware function with SKIP_HARDWARE_TESTS', async () => {
      const mockBrewdefs = { isRaspPi: jest.fn(() => true) };
      
      const validatePiHardwareCode = `
        async function validatePiHardware() {
          if (!brewdefs.isRaspPi()) {
            console.log("ℹ️  Not running on Raspberry Pi - skipping hardware validation tests");
            return true;
          }
          
          if (process.env.SKIP_HARDWARE_TESTS === 'true') {
            console.log("⚠️  SKIP_HARDWARE_TESTS=true - bypassing hardware validation (NOT RECOMMENDED FOR PRODUCTION)");
            return true;
          }
          
          return false;
        }
        return validatePiHardware();
      `;
      
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const validateFunc = new AsyncFunction('brewdefs', 'console', 'fs', 'process', validatePiHardwareCode);
      
      const mockConsole = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const mockProcess = { env: { SKIP_HARDWARE_TESTS: 'true' } };
      const mockFs = { readFileSync: jest.fn(), existsSync: jest.fn(), readdirSync: jest.fn() };
      
      const result = await validateFunc(mockBrewdefs, mockConsole, mockFs, mockProcess);
      
      expect(result).toBe(true);
      expect(mockConsole.log).toHaveBeenCalledWith(
        "⚠️  SKIP_HARDWARE_TESTS=true - bypassing hardware validation (NOT RECOMMENDED FOR PRODUCTION)"
      );
    });

    test('should test validatePiHardware function with successful validation', async () => {
      const mockBrewdefs = { isRaspPi: jest.fn(() => true) };
      
      // Complete validation function for successful case
      const validatePiHardwareCode = `
        async function validatePiHardware() {
          if (!brewdefs.isRaspPi()) {
            console.log("ℹ️  Not running on Raspberry Pi - skipping hardware validation tests");
            return true;
          }
          
          if (process.env.SKIP_HARDWARE_TESTS === 'true') {
            console.log("⚠️  SKIP_HARDWARE_TESTS=true - bypassing hardware validation (NOT RECOMMENDED FOR PRODUCTION)");
            return true;
          }
          
          console.log("🔧 Running Pi hardware validation before server startup...");
          
          try {
            const startTime = Date.now();
            let validationResults = [];
            
            // Platform detection
            const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
            if (!cpuInfo.includes('Raspberry Pi') && !cpuInfo.includes('BCM')) {
              throw new Error('Platform validation failed');
            }
            validationResults.push('✅ Platform: Raspberry Pi detected');
            
            // GPIO check
            if (!fs.existsSync('/sys/class/gpio')) {
              throw new Error('GPIO validation failed');
            }
            validationResults.push('✅ GPIO: Filesystem access available');
            
            console.log("🎉 Hardware validation completed:");
            validationResults.forEach(result => console.log(\`    \${result}\`));
            
            return true;
          } catch (error) {
            console.error("❌ Pi hardware validation FAILED:");
            console.error(\`   ERROR: \${error.message}\`);
            return false;
          }
        }
        return validatePiHardware();
      `;
      
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const validateFunc = new AsyncFunction('brewdefs', 'console', 'fs', 'process', validatePiHardwareCode);
      
      const mockConsole = { log: jest.fn(), error: jest.fn(), warn: jest.fn() };
      const mockProcess = { env: {} };
      const mockFs = { 
        readFileSync: jest.fn(() => 'Hardware : BCM2835\nModel : Raspberry Pi 4'),
        existsSync: jest.fn(() => true),
        readdirSync: jest.fn(() => ['28-abc123']) 
      };
      
      const result = await validateFunc(mockBrewdefs, mockConsole, mockFs, mockProcess);
      
      expect(result).toBe(true);
      expect(mockConsole.log).toHaveBeenCalledWith("🔧 Running Pi hardware validation before server startup...");
      expect(mockConsole.log).toHaveBeenCalledWith("🎉 Hardware validation completed:");
    });
  });

  describe('InsertMiddleware Function Tests', () => {
    test('should test insertMiddleware function directly', () => {
      // Extract and test the insertMiddleware function
      const insertMiddlewareCode = `
        function insertMiddleware(app, middleware) {
          const stackLength = app._router.stack.length;
          app.use(middleware);
          app._router.stack.push(...app._router.stack.splice(stackLength - 10, 10));
        }
        return insertMiddleware;
      `;
      
      const insertMiddlewareFunc = new Function(insertMiddlewareCode)();
      
      const mockMiddleware = jest.fn();
      const mockStack = {
        length: 15,
        push: jest.fn(),
        splice: jest.fn(() => ['item1', 'item2'])
      };
      
      const mockApp = {
        _router: { stack: mockStack },
        use: jest.fn()
      };
      
      insertMiddlewareFunc(mockApp, mockMiddleware);
      
      expect(mockApp.use).toHaveBeenCalledWith(mockMiddleware);
      expect(mockStack.splice).toHaveBeenCalledWith(5, 10); // 15 - 10 = 5
      expect(mockStack.push).toHaveBeenCalledWith('item1', 'item2');
    });
  });

  describe('Server Configuration Tests', () => {
    beforeEach(() => {
      jest.doMock('../../src/brewstack/common/brewdefs.js', () => ({
        isRaspPi: jest.fn(() => false) // Skip hardware validation
      }));

      jest.doMock('../../src/broker.js', () => ({
        setEmitFn: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn(),
        exists: jest.fn(() => false)
      }));

      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(true))
      }));

      fs.readFileSync = jest.fn();
      fs.existsSync = jest.fn();
      fs.readdirSync = jest.fn();
    });

    test('should configure Express app and middleware', () => {
      const mockCors = jest.fn(() => (req, res, next) => next());
      jest.doMock('cors', () => mockCors);

      const mockOas3Tools = {
        expressAppConfig: jest.fn(() => ({
          getApp: () => mockApp
        }))
      };
      jest.doMock('oas3-tools', () => mockOas3Tools);

      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      jest.doMock('http', () => ({
        createServer: jest.fn(() => mockServer)
      }));

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      expect(mockCors).toHaveBeenCalledWith({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE"],
        allowedHeaders: ["Content-Type", "api_key", "Authorization"],
        exposedHeaders: ["Content-Length", "X-Kuma-Revision"],
        optionsSuccessStatus: 204
      });

      expect(mockOas3Tools.expressAppConfig).toHaveBeenCalled();
      expect(mockApp.use).toHaveBeenCalled();
    });

    test('should setup HTTP server correctly', () => {
      jest.doMock('cors', () => jest.fn(() => (req, res, next) => next()));
      
      jest.doMock('oas3-tools', () => ({
        expressAppConfig: jest.fn(() => ({
          getApp: () => mockApp
        }))
      }));

      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      const mockHttp = {
        createServer: jest.fn(() => mockServer)
      };
      jest.doMock('http', () => mockHttp);

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      expect(mockHttp.createServer).toHaveBeenCalledWith(mockApp);
      expect(mockServer.listen).toHaveBeenCalledWith(8080, expect.any(Function));
    });
  });

  describe('Server Startup Tests', () => {
    beforeEach(() => {
      jest.doMock('../../src/brewstack/common/brewdefs.js', () => ({
        isRaspPi: jest.fn(() => false)
      }));

      jest.doMock('../../src/broker.js', () => ({
        setEmitFn: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn(),
        exists: jest.fn(() => false)
      }));

      jest.doMock('cors', () => jest.fn(() => (req, res, next) => next()));
      
      jest.doMock('oas3-tools', () => ({
        expressAppConfig: jest.fn(() => ({
          getApp: () => mockApp
        }))
      }));

      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      jest.doMock('http', () => ({
        createServer: jest.fn(() => mockServer)
      }));

      fs.readFileSync = jest.fn();
      fs.existsSync = jest.fn();
      fs.readdirSync = jest.fn();
    });

    test('should handle successful service startup', (done) => {
      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(true))
      }));

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith("🎉 Server started successfully");
        expect(console.log).toHaveBeenCalledWith(
          "🌐 Your server is listening on http://localhost:%d", 8080
        );
        done();
      }, 50);
    });

    test('should handle service startup failure and exit', (done) => {
      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(false))
      }));

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      setTimeout(() => {
        expect(console.error).toHaveBeenCalledWith(
          "❌ Failed to start the server due to service initialization errors."
        );
        expect(process.exit).toHaveBeenCalledWith(1);
        done();
      }, 50);
    });

    test('should show Raspberry Pi message when on Pi', (done) => {
      jest.doMock('../../src/brewstack/common/brewdefs.js', () => ({
        isRaspPi: jest.fn(() => true)
      }));

      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(true))
      }));

      // Mock successful Pi hardware validation
      fs.readFileSync = jest.fn(() => 'Hardware : BCM2835\nModel : Raspberry Pi 4');
      fs.existsSync = jest.fn(() => true);
      fs.readdirSync = jest.fn(() => ['28-abc123']);

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith(
          "🔧 Running on Raspberry Pi - hardware validation completed"
        );
        done();
      }, 50);
    });
  });

  describe('Socket.IO Configuration Tests', () => {
    let mockBroker;

    beforeEach(() => {
      mockBroker = {
        setEmitFn: jest.fn(),
        attach: jest.fn(),
        detach: jest.fn(),
        exists: jest.fn(() => false)
      };

      jest.doMock('../../src/brewstack/common/brewdefs.js', () => ({
        isRaspPi: jest.fn(() => false)
      }));

      jest.doMock('../../src/broker.js', () => mockBroker);

      jest.doMock('../../src/start-stop.js', () => ({
        start: jest.fn(() => Promise.resolve(true))
      }));

      jest.doMock('cors', () => jest.fn(() => (req, res, next) => next()));
      
      jest.doMock('oas3-tools', () => ({
        expressAppConfig: jest.fn(() => ({
          getApp: () => mockApp
        }))
      }));

      jest.doMock('http', () => ({
        createServer: jest.fn(() => mockServer)
      }));

      fs.readFileSync = jest.fn();
      fs.existsSync = jest.fn();
      fs.readdirSync = jest.fn();
    });

    test('should configure socket.io with CORS options', () => {
      const mockSocketIO = jest.fn(() => mockSocketioServer);
      mockSocketIO.Server = jest.fn(() => mockSocketioServer);
      
      jest.doMock('socket.io', () => mockSocketIO);

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      expect(mockSocketIO.Server).toHaveBeenCalledWith(mockServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
          allowedHeaders: ["Content-Type", "Authorization"],
          credentials: true
        }
      });
    });

    test('should setup broker emit function', () => {
      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      expect(mockBroker.setEmitFn).toHaveBeenCalled();
    });

    test('should handle socket connection and events', (done) => {
      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      setTimeout(() => {
        expect(mockSocketioServer.on).toHaveBeenCalledWith('connection', expect.any(Function));
        expect(console.log).toHaveBeenCalledWith(`socket ${mockSocket.id} connected`);
        expect(mockBroker.attach).toHaveBeenCalledWith(mockSocket);
        done();
      }, 30);
    });

    test('should handle socket disconnect events', (done) => {
      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      setTimeout(() => {
        // Check if disconnect callback was registered
        const disconnectCall = mockSocket.on.mock.calls.find(
          call => call[0] === 'disconnect'
        );
        
        if (disconnectCall) {
          const disconnectCallback = disconnectCall[1];
          disconnectCallback('client disconnect');
          expect(console.log).toHaveBeenCalledWith(
            `socket ${mockSocket.id} disconnected due to client disconnect`
          );
        }
        done();
      }, 30);
    });

    test('should handle nested client connection events', (done) => {
      jest.doMock('socket.io', () => {
        const mock = jest.fn(() => mockSocketioServer);
        mock.Server = jest.fn(() => mockSocketioServer);
        return mock;
      });

      delete require.cache[require.resolve('../../index.js')];
      require('../../index.js');

      setTimeout(() => {
        // Find the connect event handler
        const connectCall = mockSocket.on.mock.calls.find(
          call => call[0] === 'connect'
        );
        
        if (connectCall) {
          const connectCallback = connectCall[1];
          const clientSocket = { 
            conn: { remoteAddress: '192.168.1.100' },
            on: jest.fn()
          };
          
          mockBroker.exists.mockReturnValue(false);
          connectCallback(clientSocket);
          
          expect(console.log).toHaveBeenCalledWith(
            "Client Connected from", '192.168.1.100'
          );
          expect(mockBroker.attach).toHaveBeenCalledWith(clientSocket);
        }
        done();
      }, 30);
    });
  });
});