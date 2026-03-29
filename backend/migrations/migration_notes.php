<?php

require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();
    
    // Create Notes table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS notes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Add Menu
    $stmt = $pdo->prepare("SELECT id FROM menus WHERE path = '/dashboard/notes'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO menus (name, path, icon, permission_key) VALUES ('Notlar', '/dashboard/notes', 'StickyNote', NULL)");
        $menu_id = $pdo->lastInsertId();
        
        // Add to roles (Assume 1=Admin, 2=User)
        $pdo->exec("INSERT IGNORE INTO role_menus (role_id, menu_id) VALUES (1, $menu_id)");
        $pdo->exec("INSERT IGNORE INTO role_menus (role_id, menu_id) VALUES (2, $menu_id)");
    }

    echo "Notes migration successful!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
