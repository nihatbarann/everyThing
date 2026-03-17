<?php
global $router;

// Installation endpoints
$router->get('/api/install/check', 'InstallController@check');
$router->post('/api/install/test', 'InstallController@testConnection');
$router->post('/api/install/setup', 'InstallController@setup');

// Auth endpoints
$router->post('/api/auth/login', 'AuthController@login');

// User Management endpoints
$router->get('/api/users', 'UserController@index');
$router->post('/api/users', 'UserController@create');
$router->delete('/api/users/{id}', 'UserController@delete');

// System Management
$router->post('/api/system/optimize', 'SystemController@optimize');

