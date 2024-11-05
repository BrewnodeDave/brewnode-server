"use strict";

var path = require("path");
var http = require("http");

const cors = require("cors");

var oas3Tools = require("oas3-tools");
var serverPort = 8080;

// swaggerRouter configuration
var options = {
  routing: {
    controllers: path.join(__dirname, "./controllers"),
  },
};

var expressAppConfig = oas3Tools.expressAppConfig(
  path.join(__dirname, "api.yaml"),
  options
);
var app = expressAppConfig.getApp();

//move the "SwaggerRouter" and the "ErrorHandler" at the end of the stack (after the new middleware)
function insertMiddleware(app, middleware) {
  const stackLength = app._router.stack.length;
  app.use(middleware);
  app._router.stack.push(...app._router.stack.splice(stackLength - 10, 10));
}

const corsOptions = {
  origin: true, // Allow any origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
  allowedHeaders: ["Content-Type", "api_key", "Authorization"], // Allowed headers
  exposedHeaders: ["Content-Length", "X-Kuma-Revision"], // Exposed headers
  optionsSuccessStatus: 204, // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

const corsMiddleware = cors(corsOptions);
insertMiddleware(app, corsMiddleware);

// Initialize the Swagger middleware
const httpServer = http.createServer(app).listen(serverPort, function () {
  console.log(
    "Your server is listening on port %d (http://localhost:%d)",
    serverPort,
    serverPort
  );
  console.log(
    "Swagger-ui is available on http://localhost:%d/docs",
    serverPort
  );
});

const broker = require("./src/broker.js");
const socketio = require("socket.io");
const serverSocket = socketio(httpServer);
// initialiseClient(serverSocket);

//////////////
// Initialize socket.io with CORS options
const io = new socketio.Server(httpServer, {
  cors: {
      origin: "*", // Allow any origin
      methods: ["GET", "POST"], // Allowed methods
      allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
      credentials: true // Allow credentials
  }
});

io.on("connection", (socket) => {
    console.log(`socket ${socket.id} connected`);

    broker.attach(socket)

    // send an event to the client
    socket.emit("foo", "bar");

    socket.on("foobar", () => {
        // an event was received from the client
        console.log(`foobar`);

    });

    // upon disconnection
    socket.on("disconnect", (reason) => {
        console.log(`socket ${socket.id} disconnected due to ${reason}`);
    });
    
    socket.on("connect", (clientSocket) => {
        // console.log('connect',socket.id);
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
          //console.error('connect: broker socket already exists');
        }
      });
});

broker.setEmitFn(serverSocket.emit);

io.listen(4000);

