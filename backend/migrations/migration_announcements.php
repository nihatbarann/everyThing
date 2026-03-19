<?php

require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    echo "Running Announcements Migration...\n";

    // 1. Create announcements table
    $createTableSql = "
    CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        short_description VARCHAR(500) NOT NULL,
        content TEXT NOT NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'low',
        is_published TINYINT(1) DEFAULT 1,
        view_count INT DEFAULT 0,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createTableSql);
    echo "Table 'announcements' created or already exists.\n";

    // 2. Add permission
    $permissionSql = "
    INSERT IGNORE INTO permissions (`key`, name, description) 
    VALUES ('announcement_manage', 'Duyuru Yönetimi', 'Duyuru ekleme, düzenleme ve silme yetkisi');
    ";
    $pdo->exec($permissionSql);
    echo "Permission 'announcement_manage' added.\n";

    // 3. Get the ID of the new permission
    $stmt = $pdo->query("SELECT id FROM permissions WHERE `key` = 'announcement_manage'");
    $permissionId = $stmt->fetchColumn();

    // 4. Assign permission to Admin role (role_id = 1)
    if ($permissionId) {
        $rolePermissionSql = "
        INSERT IGNORE INTO role_permissions (role_id, permission_id) 
        VALUES (1, $permissionId);
        ";
        $pdo->exec($rolePermissionSql);
        echo "Permission assigned to Admin role.\n";
    }

    echo "Announcements Migration completed successfully.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
