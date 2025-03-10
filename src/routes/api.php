<?php
require_once '../controllers/UserController.php';

$router = new \Slim\Routing\RouteCollector(new \Slim\RouteParser(), new \Slim\CallableResolver());

$router->get('/users/{id}', 'UserController:getUser');
$router->post('/users', 'UserController:createUser');
$router->put('/users/{id}', 'UserController:updateUser');
$router->delete('/users/{id}', 'UserController:deleteUser');

$app = new \Slim\App();
$app->group('/api', function () use ($router) {
    $router->get('/users/{id}', 'UserController:getUser');
    $router->post('/users', 'UserController:createUser');
    $router->put('/users/{id}', 'UserController:updateUser');
    $router->delete('/users/{id}', 'UserController:deleteUser');
});

$app->run();
?>