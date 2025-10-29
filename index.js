"use strict";

const path = require("path");
const http = require("http");
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

  console.log("🔧 Running Pi hardware validation tests before server startup...");
  
  try {
    // Run Pi hardware tests with timeout
    const testCommand = "npm run test:pi --silent";
    const startTime = Date.now();
    
    execSync(testCommand, { 
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000 // 30 second timeout
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Pi hardware tests passed in ${duration}ms - server startup approved`);
    return true;
    
  } catch (error) {
    console.error("❌ Pi hardware validation tests FAILED:");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    if (error.stdout) {
      console.error("Test Output:");
      console.error(error.stdout.toString());
    }
    
    if (error.stderr) {
      console.error("Test Errors:");
      console.error(error.stderr.toString());
    }
    
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("🛑 Server startup BLOCKED due to hardware validation failures");
    console.error("   Please fix hardware issues before starting the brewery server");
    console.error("   Check connections for: I2C devices, GPIO access, temperature sensors");
    
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


