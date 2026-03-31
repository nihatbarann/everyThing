<?php
require_once __DIR__ . '/backend/Core/Database.php';

try {
    $pdo = Database::getConnection();
    
    // Insert tools_view permission if it doesn't exist
    $pdo->exec("INSERT IGNORE INTO permissions (`key`, name, description, module) 
                VALUES ('tools_view', 'Araçlar Erişimi (Araç Kutusu)', 'Resim boyutlandırma, Format dönüştürme ve QR kod işlemlerinin bulunduğu çok amaçlı araçlar paneline erişim sağlar', 'Tools')");
    
    $permId = $pdo->query("SELECT id FROM permissions WHERE `key` = 'tools_view'")->fetchColumn();
    
    if ($permId) {
        echo "tools_view permission is present (ID: $permId).\n";
        
        // Grant this to admins (role_id = 1)
        $admins = $pdo->query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' OR u.role_id = 1")->fetchAll(PDO::FETCH_COLUMN);
        
        $insertStmt = $pdo->prepare("INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)");
        foreach ($admins as $adminId) {
            $insertStmt->execute([$adminId, $permId]);
        }
        
        echo "Granted tools_view permission to Admins.\n";
    }
    
    // Also, ensure the menu has the correct permission_key attached.
    $pdo->exec("UPDATE menus SET permission_key = 'tools_view' WHERE path = '/dashboard/tools'");
    
    echo "Tools menu restored beautifully.\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
