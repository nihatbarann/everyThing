<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    echo "Running Tickets Migration...\n";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS tickets (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
            start_at DATETIME NOT NULL,
            due_at DATETIME NOT NULL,
            status ENUM('open','completed') NOT NULL DEFAULT 'open',
            extension_status ENUM('none','pending','approved','rejected') NOT NULL DEFAULT 'none',
            requested_hours INT NULL,
            extension_reason TEXT NULL,
            is_archived TINYINT(1) NOT NULL DEFAULT 0,
            created_by INT NOT NULL,
            assigned_to INT NOT NULL,
            completed_at DATETIME NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_assigned (assigned_to, is_archived),
            INDEX idx_created (created_by, is_archived)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Table 'tickets' ready.\n";

    $stmt = $pdo->prepare("SELECT id FROM menus WHERE path = '/dashboard/tickets'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO menus (name, path, icon, permission_key) VALUES ('Ticketlar', '/dashboard/tickets', 'Tickets', NULL)");
        echo "Menu item 'Ticketlar' added.\n";
    }

    echo "Tickets Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
