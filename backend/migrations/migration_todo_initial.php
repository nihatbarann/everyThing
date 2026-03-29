<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();
    
    echo "Running Todo Initial Migration...\n";

    // 1. Create todos table
    $createTableSql = "
    CREATE TABLE IF NOT EXISTS `todos` (
        `id` INT AUTO_INCREMENT PRIMARY KEY,
        `title` VARCHAR(255) NOT NULL,
        `description` TEXT,
        `status` ENUM('todo', 'in_progress', 'done') NOT NULL DEFAULT 'todo',
        `creator_id` INT NOT NULL,
        `assigned_to` INT NULL,
        `target_date` DATETIME NULL,
        `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
        `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (`creator_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
        FOREIGN KEY (`assigned_to`) REFERENCES `users`(`id`) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ";
    
    $pdo->exec($createTableSql);
    echo "Table 'todos' created or already exists.\n";

    // 2. Add permission
    $permissionSql = "
    INSERT IGNORE INTO `permissions` (`key`, `name`, `description`) 
    VALUES ('todo_view', 'Yapılacaklar Menüsü', 'Yapılacaklar Pano modülüne erişim izni');
    ";
    $pdo->exec($permissionSql);
    echo "Permission 'todo_view' added.\n";

    // 3. Add Menu item
    $stmt = $pdo->prepare("SELECT id FROM menus WHERE path = '/dashboard/todos'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO `menus` (`name`, `path`, `icon`, `permission_key`) 
                    VALUES ('Yapılacaklar', '/dashboard/todos', 'ListTodo', 'todo_view')");
        echo "Menu item 'Yapılacaklar' added.\n";
    }

    // 4. Assign permission to Admin role (role_id = 1)
    $stmt = $pdo->query("SELECT id FROM permissions WHERE `key` = 'todo_view'");
    $permissionId = $stmt->fetchColumn();
    
    if ($permissionId) {
        $rolePermissionSql = "
        INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
        VALUES (1, $permissionId);
        ";
        $pdo->exec($rolePermissionSql);
        echo "Permission assigned to Admin role.\n";
    }

    echo "Todo Initial Migration completed successfully.\n";

} catch (PDOException $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}
