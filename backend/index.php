<?php
// Initialize Config and Routes
require_once __DIR__ . '/Core/Router.php';
require_once __DIR__ . '/Core/Database.php';

// ── Security Headers ───────────────────────────────────────────────
$allowedOrigin = getenv('CORS_ORIGIN') ?: '*';  // Set CORS_ORIGIN in production!

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . $allowedOrigin);
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

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
