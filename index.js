"use strict";

const path = require("path");
const http = require("http");
const fs = require("fs");
const { execSync } = require("child_process");

const cors = require("cors");
const broker = require("./src/broker.js");
const socketio = require("socket.io");
const oas3Tools = require("oas3-tools");

const {start} = require("./src/start-stop.js");
const brewdefs = require("./src/brewstack/common/brewdefs.js");

const serverPort = 8080;
const wsPort = 4000;

/**
 * Run Pi hardware validation tests before server startup
 * @returns {Promise<boolean>} True if tests pass or not on Pi, false if tests fail
 */
async function validatePiHardware() {
  // Only run Pi tests if we're actually on a Raspberry Pi
  if (!brewdefs.isRaspPi()) {
    console.log("ℹ️  Not running on Raspberry Pi - skipping hardware validation tests");
    return true;
  }

  // Allow skipping hardware validation for development/debugging
  if (process.env.SKIP_HARDWARE_TESTS === 'true') {
    console.log("⚠️  SKIP_HARDWARE_TESTS=true - bypassing hardware validation (NOT RECOMMENDED FOR PRODUCTION)");
    return true;
  }

  console.log("🔧 Running Pi hardware validation before server startup...");
  
  try {
    const startTime = Date.now();
    let validationResults = [];

    // Test 1: Platform Detection
    console.log("  📋 Checking platform identification...");
    const cpuInfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    if (!cpuInfo.includes('Raspberry Pi') && !cpuInfo.includes('BCM')) {
      throw new Error('Platform validation failed - not detected as Raspberry Pi hardware');
    }
    validationResults.push('✅ Platform: Raspberry Pi detected');

    // Test 2: GPIO Access
    console.log("  🔌 Checking GPIO filesystem access...");
    if (!fs.existsSync('/sys/class/gpio')) {
      throw new Error('GPIO validation failed - /sys/class/gpio not accessible');
    }
    validationResults.push('✅ GPIO: Filesystem access available');

    // Test 3: I2C Bus Access
    console.log("  🔗 Checking I2C bus access...");
    const i2cDevices = ['/dev/i2c-1', '/dev/i2c-0'];
    let i2cAvailable = false;
    for (const device of i2cDevices) {
      if (fs.existsSync(device)) {
        i2cAvailable = true;
        validationResults.push(`✅ I2C: ${device} accessible`);
        break;
      }
    }
    if (!i2cAvailable) {
      console.warn('⚠️  I2C: No I2C devices found - some brewery functions may not work');
      validationResults.push('⚠️  I2C: No devices detected (pumps/valves may not work)');
    }

    // Test 4: OneWire Temperature Sensors
    console.log("  🌡️  Checking OneWire temperature sensor support...");
    if (fs.existsSync('/sys/bus/w1/devices')) {
      try {
        const w1Devices = fs.readdirSync('/sys/bus/w1/devices');
        const tempSensors = w1Devices.filter(device => device.startsWith('28-') || device.startsWith('10-'));
        if (tempSensors.length > 0) {
          validationResults.push(`✅ Temperature: ${tempSensors.length} DS18x20 sensors detected`);
        } else {
          validationResults.push('⚠️  Temperature: OneWire available but no sensors detected');
        }
      } catch (error) {
        validationResults.push('⚠️  Temperature: OneWire filesystem not readable');
      }
    } else {
      validationResults.push('⚠️  Temperature: OneWire not enabled (temperature monitoring disabled)');
    }

    // Test 5: Basic Service Initialization Test
    console.log("  ⚙️  Testing basic service initialization...");
    try {
      // Try to load critical services to ensure they don't throw immediate errors
      const tempService = require('./src/services/temp-service.js');
      const i2cService = require('./src/services/i2c_raspi-service.js');
      
      // Basic module loading test
      if (typeof tempService.start !== 'function') {
        throw new Error('Temperature service not properly exported');
      }
      if (typeof i2cService.start !== 'function') {
        throw new Error('I2C service not properly exported');
      }
      
      validationResults.push('✅ Services: Core modules loaded successfully');
    } catch (error) {
      throw new Error(`Service initialization failed: ${error.message}`);
    }

    const duration = Date.now() - startTime;
    
    console.log("🎉 Hardware validation completed:");
    validationResults.forEach(result => console.log(`    ${result}`));
    console.log(`✅ Pi hardware validation passed in ${duration}ms - server startup approved`);
    
    return true;
    
  } catch (error) {
    console.error("❌ Pi hardware validation FAILED:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(`   ERROR: ${error.message}`);
    console.error("");
    console.error("   Common solutions:");
    console.error("   • Enable I2C: sudo raspi-config -> Interface Options -> I2C -> Enable");
    console.error("   • Enable OneWire: Add 'dtoverlay=w1-gpio' to /boot/config.txt");
    console.error("   • Check GPIO permissions: Add user to 'gpio' group");
    console.error("   • For service deployment: Use SKIP_HARDWARE_TESTS=true (not recommended)");
    console.error("");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("🛑 Server startup BLOCKED due to hardware validation failures");
    
    return false;
  }
}

// swaggerRouter configuration
const options = {
  routing: {
    controllers: path.join(__dirname, "./controllers"),
  },
};

const expressAppConfig = oas3Tools.expressAppConfig(
  path.join(__dirname, "api.yaml"),
  options
);

// http://localhost:8080/ferment?profile={"steps":[{"actualTime":1735516800000,"displayPressure":null,"displayStepTemp":18,"pressure":null,"ramp":null,"stepTemp":18,"stepTime":1,"type":"Primary"},{"actualTime":1735603200000,"displayPressure":null,"displayStepTemp":19,"pressure":null,"ramp":null,"stepTemp":19,"stepTime":1,"type":"Primary"},{"actualTime":1735689600000,"displayPressure":null,"displayStepTemp":20,"pressure":null,"ramp":null,"stepTemp":20,"stepTime":7,"type":"Primary"},{"actualRampTime":1736294400000,"actualTime":1736899200000,"displayPressure":null,"displayStepTemp":0,"pressure":null,"ramp":7,"stepTemp":0,"stepTime":3,"type":"Cold Crash"},{"actualTime":1737158400000,"displayPressure":null,"displayStepTemp":4,"pressure":null,"ramp":null,"stepTemp":4,"stepTime":7,"type":"Carbonation"}]}

const app = expressAppConfig.getApp();

//move the "SwaggerRouter" and the "ErrorHandler" at the end of the stack (after the new middleware)
function insertMiddleware(app, middleware) {
  const stackLength = app._router.stack.length;
  app.use(middleware);
  app._router.stack.push(...app._router.stack.splice(stackLength - 10, 10));
}

const corsOptions = {
  origin: true, // Allow any origin
  credentials: true,
  methods: ["GET", "POST", "PUT"], // Allowed methods
  allowedHeaders: ["Content-Type", "api_key", "Authorization"], // Allowed headers
  exposedHeaders: ["Content-Length", "X-Kuma-Revision"], // Exposed headers
  optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

const corsMiddleware = cors(corsOptions);
insertMiddleware(app, corsMiddleware);

// Initialize the Swagger middleware
const httpServer = http.createServer(app).listen(serverPort, async function () {
  
  // Step 1: Validate Pi hardware if running on Raspberry Pi
  const hardwareValid = await validatePiHardware();
  if (!hardwareValid) {
    console.error("🚨 CRITICAL: Hardware validation failed - shutting down server");
    process.exit(1);
  }

  // Step 2: Start all brewery services
  const started = await start();
  if (!started) {
    console.error("❌ Failed to start the server due to service initialization errors.");
    process.exit(1);
  }
  
  console.log("🎉 Server started successfully");
  console.log("🌐 Your server is listening on http://localhost:%d", serverPort);
  console.log("📚 Swagger-ui is available on http://localhost:%d/docs", serverPort);
  
  if (brewdefs.isRaspPi()) {
    console.log("🔧 Running on Raspberry Pi - hardware validation completed");
  }
});

const serverSocket = socketio(httpServer);
broker.setEmitFn(serverSocket.emit);

// Initialize socket.io with CORS options
const io = new socketio.Server(httpServer, {
  cors: {
      origin: "*", // Allow any origin
      methods: ["GET", "POST"], // Allowed methods
      allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
      credentials: true // Allow credentials
  }
}).listen(wsPort);

io.on("connection", (ws) => {
    console.log(`socket ${ws.id} connected`);

    broker.attach(ws)

    ws.on("disconnect", (reason) => {
          console.log(`socket ${ws.id} disconnected due to ${reason}`);
    });
    
    ws.on("connect", (clientSocket) => {
      if (broker.exists(clientSocket) === false) {
        console.log("Client Connected from", clientSocket.conn.remoteAddress);
  
        clientSocket.on("disconnect", (reason) => {
          if (reason === "io server disconnect") {
            //client.connect();
          }
          broker.detach(clientSocket);
        });
  
        broker.attach(clientSocket);
      } else {
        console.log('connect: broker socket already exists');
      }
    });
});


