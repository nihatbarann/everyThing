<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();
    
    // Create Links table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS links (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            category VARCHAR(50) NULL,
            url TEXT NOT NULL,
            username VARCHAR(255),
            password VARCHAR(255),
            notes TEXT,
            is_favorite TINYINT(1) NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Add Menu
    $stmt = $pdo->prepare("SELECT id FROM menus WHERE path = '/dashboard/links'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO menus (name, path, icon, permission_key) VALUES ('Linkler', '/dashboard/links', 'Vault', NULL)");
        $menu_id = $pdo->lastInsertId();
        
        $pdo->exec("INSERT IGNORE INTO role_menus (role_id, menu_id) VALUES (1, $menu_id)");
        $pdo->exec("INSERT IGNORE INTO role_menus (role_id, menu_id) VALUES (2, $menu_id)");
    }

    echo "Links migration successful!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
