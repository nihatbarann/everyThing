<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    echo "Running Monitors Migration...\n";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS monitors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            location VARCHAR(150) NULL,
            device_type ENUM('switch','access_point','modem','router','camera','server','other') NOT NULL DEFAULT 'other',
            check_type ENUM('tcp','http') NOT NULL DEFAULT 'tcp',
            target VARCHAR(255) NOT NULL,
            port INT NULL,
            last_status ENUM('up','down','unknown') NOT NULL DEFAULT 'unknown',
            last_checked_at DATETIME NULL,
            last_response_ms INT NULL,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Table 'monitors' ready.\n";

    // Short rolling history per monitor — powers the uptime % and heartbeat bar.
    // Pruned to the most recent ~50 rows per monitor on every check.
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS monitor_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            monitor_id INT NOT NULL,
            status ENUM('up','down') NOT NULL,
            response_ms INT NULL,
            checked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (monitor_id) REFERENCES monitors(id) ON DELETE CASCADE,
            INDEX idx_monitor_logs_monitor_id (monitor_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Table 'monitor_logs' ready.\n";

    // Menu — open to all authenticated users, same pattern as Notes/Links/Projects
    $stmt = $pdo->prepare("SELECT id FROM menus WHERE path = '/dashboard/monitors'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO menus (name, path, icon, permission_key) VALUES ('İzleme', '/dashboard/monitors', 'Monitors', NULL)");
        echo "Menu item 'İzleme' added.\n";
    }

    echo "Monitors Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
