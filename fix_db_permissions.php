<?php
require_once __DIR__ . '/backend/Core/Database.php';

try {
    $pdo = Database::getConnection();
    
    // Clear permission key for Dashboard and Todo menus
    $pdo->exec("UPDATE menus SET permission_key = NULL WHERE path = '/dashboard' OR path = '/dashboard/todos'");
    
    // We can also delete the 'todo_%' and 'dashboard_%' permissions from the permissions table so they do not show up in the UserEdit screen.
    $pdo->exec("DELETE FROM permissions WHERE `key` LIKE 'todo_%' OR `key` LIKE 'dashboard_%'");
    
    echo "Permissions updated successfully.";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
