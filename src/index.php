<?php
require_once 'config/database.php';
require_once 'routes/api.php';

header("Content-Type: application/json; charset=UTF-8");

$requestMethod = $_SERVER["REQUEST_METHOD"];
$requestUri = explode('/', trim($_SERVER['PATH_INFO'], '/'));

$api = new Api();
$api->handleRequest($requestMethod, $requestUri);
?>