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

var expressAppConfig = oas3Tools.expressAppConfig(path.join(__dirname, 'api/openapi.yaml'), options);
var app = expressAppConfig.getApp();

function insertMiddleware(app, middleware) {
    const stackLength = app._router.stack.length;
    app.use(middleware);
    app._router.stack.push(...app._router.stack.splice(stackLength - 2, 2));
}

// Insert Authentication Middleware
app.use(authenticate);

insertMiddleware(app, cors());

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
    console.log('Your server is listening on port %d (http://localhost:%d)', serverPort, serverPort);
    console.log('Swagger-ui is available on http://localhost:%d/docs', serverPort);
});

function insertMiddleware(app, middleware) {
    const stackLength = app._router.stack.length;
    app.use(middleware);
    app._router.stack.push(...app._router.stack.splice(stackLength - 2, 2));
}


// Authentication Middleware
function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    // if (!authHeader) {
    //     return;
    // }

    const auth = authHeader.split(' ')[1];
    const credentials = Buffer.from(auth, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    // Verify username and password
    if (username === 'HGoAWTzdg5NdBMxYebUNQrxvCyH3' && password === 'YYlPKDfF7O5LyApAzwrdP2znt8Hyx0ReqoYFFxPPCCzV7Z1te0SiMMWldneqaIqa') {
        next();
    } else {
        res.status(401).send('Invalid credentials');
    }
}
