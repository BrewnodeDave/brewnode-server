'use strict';

var path = require('path');
var http = require('http');

const cors = require('cors');

var oas3Tools = require('oas3-tools');
var serverPort = 8080;

// swaggerRouter configuration
var options = {
    routing: {
        controllers: path.join(__dirname, './controllers')
    },
};

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api.yaml'), options);
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
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'api_key', 'Authorization'], // Allowed headers
    exposedHeaders: ['Content-Length', 'X-Kuma-Revision'], // Exposed headers
    optionsSuccessStatus: 204 // Some legacy browsers (IE11, various SmartTVs) choke on 204
};

const corsMiddleware = cors(corsOptions);
insertMiddleware(app, corsMiddleware);

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});


