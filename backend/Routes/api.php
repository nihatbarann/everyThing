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

// Projects
$router->get('/api/projects', 'ProjectController@index');
$router->post('/api/projects', 'ProjectController@create');
$router->get('/api/projects/{id}', 'ProjectController@show');
$router->put('/api/projects/{id}', 'ProjectController@update');
$router->delete('/api/projects/{id}', 'ProjectController@delete');
$router->post('/api/projects/{id}/members', 'ProjectController@addMember');
$router->delete('/api/projects/{id}/members/{userId}', 'ProjectController@removeMember');

// Project Notes (text & diagram)
$router->get('/api/projects/{projectId}/notes', 'ProjectNoteController@index');
$router->post('/api/projects/{projectId}/notes', 'ProjectNoteController@create');
$router->get('/api/projects/{projectId}/notes/{id}', 'ProjectNoteController@show');
$router->put('/api/projects/{projectId}/notes/{id}', 'ProjectNoteController@update');
$router->delete('/api/projects/{projectId}/notes/{id}', 'ProjectNoteController@delete');

// Project Links (vault)
$router->get('/api/projects/{projectId}/links', 'ProjectLinkController@index');
$router->post('/api/projects/{projectId}/links', 'ProjectLinkController@create');
$router->put('/api/projects/{projectId}/links/{id}', 'ProjectLinkController@update');
$router->delete('/api/projects/{projectId}/links/{id}', 'ProjectLinkController@delete');

// Project Todos (kanban)
$router->get('/api/projects/{projectId}/todos', 'ProjectTodoController@index');
$router->post('/api/projects/{projectId}/todos', 'ProjectTodoController@create');
$router->put('/api/projects/{projectId}/todos/{id}', 'ProjectTodoController@update');
$router->put('/api/projects/{projectId}/todos/{id}/status', 'ProjectTodoController@updateStatus');
$router->delete('/api/projects/{projectId}/todos/{id}', 'ProjectTodoController@delete');

// Certificates / Domain expiry tracking
$router->get('/api/certificates', 'CertificateController@index');
$router->post('/api/certificates', 'CertificateController@create');
$router->put('/api/certificates/{id}', 'CertificateController@update');
$router->delete('/api/certificates/{id}', 'CertificateController@delete');
$router->post('/api/certificates/{id}/check', 'CertificateController@check');

// Device / network monitoring (switches, APs, modems, cameras, ...)
$router->get('/api/monitors', 'MonitorController@index');
$router->post('/api/monitors', 'MonitorController@create');
$router->post('/api/monitors/check-all', 'MonitorController@checkAll');
$router->put('/api/monitors/{id}', 'MonitorController@update');
$router->delete('/api/monitors/{id}', 'MonitorController@delete');
$router->post('/api/monitors/{id}/check', 'MonitorController@check');

// Tickets (peer-to-peer daily task assignment)
$router->get('/api/tickets/archived', 'TicketController@archived');
$router->get('/api/tickets', 'TicketController@index');
$router->post('/api/tickets', 'TicketController@create');
$router->get('/api/tickets/{id}', 'TicketController@show');
$router->put('/api/tickets/{id}', 'TicketController@update');
$router->delete('/api/tickets/{id}', 'TicketController@delete');
$router->put('/api/tickets/{id}/complete', 'TicketController@complete');
$router->post('/api/tickets/{id}/extension', 'TicketController@requestExtension');
$router->put('/api/tickets/{id}/extension/respond', 'TicketController@respondExtension');
$router->post('/api/tickets/{id}/comments', 'TicketController@addComment');
$router->put('/api/tickets/{id}/reassign', 'TicketController@reassign');
