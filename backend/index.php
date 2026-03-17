<?php
// Initialize Config and Routes
require_once __DIR__ . '/Core/Router.php';
require_once __DIR__ . '/Core/Database.php';

// Define headers for JSON API
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Router instance
$router = new Router();

// Define basic routes
require_once __DIR__ . '/Routes/api.php';

// Handle request
$router->dispatch($_SERVER['REQUEST_URI'], $_SERVER['REQUEST_METHOD']);
