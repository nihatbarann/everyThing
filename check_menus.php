<?php
require_once __DIR__ . '/backend/Core/Database.php';

try {
    $pdo = Database::getConnection();
    
    // Check menus
    $menus = $pdo->query("SELECT id, name, path, permission_key FROM menus")->fetchAll(PDO::FETCH_ASSOC);
    echo "MENUS:\n";
    print_r($menus);
    
    // Check tools permission
    $perms = $pdo->query("SELECT * FROM permissions WHERE name LIKE '%tool%' OR `key` LIKE '%tool%'")->fetchAll(PDO::FETCH_ASSOC);
    echo "\nPERMISSIONS:\n";
    print_r($perms);
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
