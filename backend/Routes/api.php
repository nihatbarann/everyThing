<?php
global $router;

// Installation endpoints
$router->get('/api/install/check', 'InstallController@check');
$router->post('/api/install/test', 'InstallController@testConnection');
$router->post('/api/install/setup', 'InstallController@setup');

// Auth endpoints
$router->post('/api/auth/login', 'AuthController@login');
$router->get('/api/auth/me', 'AuthController@me');

// Menu endpoints (permission-filtered)
$router->get('/api/menus', 'MenuController@index');

// User Management endpoints
$router->get('/api/users/managers', 'UserController@managers');
$router->get('/api/users', 'UserController@index');
$router->get('/api/users/{id}', 'UserController@show');
$router->post('/api/users', 'UserController@create');
$router->put('/api/users/{id}', 'UserController@update');
$router->put('/api/users/{id}/status', 'UserController@toggleStatus');
$router->put('/api/users/{id}/reset-password', 'UserController@resetPassword');
$router->delete('/api/users/{id}', 'UserController@delete');

// Role Management endpoints
$router->get('/api/roles', 'RoleController@index');
$router->get('/api/roles/{id}/permissions', 'RoleController@getPermissions');
$router->put('/api/roles/{id}/permissions', 'RoleController@updatePermissions');

// Permissions (For User-Based Auth configuration)
$router->get('/api/permissions', 'PermissionController@index');

// Todo (Kanban) endpoints
$router->get('/api/todos/archived', 'TodoController@archived');
$router->get('/api/todos', 'TodoController@index');
$router->post('/api/todos', 'TodoController@create');
$router->put('/api/todos/{id}', 'TodoController@update');
$router->put('/api/todos/{id}/status', 'TodoController@updateStatus');
$router->put('/api/todos/{id}/archive', 'TodoController@archive');
$router->put('/api/todos/{id}/unarchive', 'TodoController@unarchive');
$router->delete('/api/todos/{id}', 'TodoController@delete');

// Notes endpoints
$router->get('/api/notes', 'NoteController@index');
$router->get('/api/notes/{id}', 'NoteController@show');
$router->post('/api/notes', 'NoteController@create');
$router->put('/api/notes/{id}', 'NoteController@update');
$router->delete('/api/notes/{id}', 'NoteController@delete');

// Links endpoints
$router->get('/api/links', 'LinkController@index');
$router->post('/api/links', 'LinkController@create');
$router->put('/api/links/{id}', 'LinkController@update');
$router->delete('/api/links/{id}', 'LinkController@delete');

// Announcements endpoints
$router->get('/api/announcements/latest', 'AnnouncementController@latest');
$router->get('/api/announcements', 'AnnouncementController@index');
$router->get('/api/announcements/{id}', 'AnnouncementController@show');
$router->post('/api/announcements', 'AnnouncementController@create');
$router->put('/api/announcements/{id}', 'AnnouncementController@update');
$router->delete('/api/announcements/{id}', 'AnnouncementController@delete');

// Calendar endpoints
$router->get('/api/calendar', 'CalendarController@index');
$router->post('/api/calendar', 'CalendarController@create');
$router->put('/api/calendar/{id}', 'CalendarController@update');
$router->delete('/api/calendar/{id}', 'CalendarController@delete');

// System Management
$router->post('/api/system/optimize', 'SystemController@optimize');
$router->get('/api/system/config', 'SystemController@getConfig');
$router->put('/api/system/config', 'SystemController@updateConfig');
$router->get('/api/system/db-info', 'SystemController@getDbInfo');
$router->get('/api/system/export-db', 'SystemController@exportDb');

// Data Export / Import (per-user personal data)
$router->get('/api/data/export', 'DataController@export');
$router->post('/api/data/import/preview', 'DataController@previewImport');
$router->post('/api/data/import', 'DataController@import');

// Activity Logs (admin-only)
$router->get('/api/activity-logs', 'ActivityLogController@index');


// Menu Order (per-user)
$router->post('/api/menus/order', 'MenuController@saveOrder');
