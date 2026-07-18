<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    echo "Running Certificates Migration...\n";

    $pdo->exec("
        CREATE TABLE IF NOT EXISTS certificates (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            type ENUM('domain','ssl','other') NOT NULL DEFAULT 'other',
            hostname VARCHAR(255) NULL,
            expires_at DATE NOT NULL,
            provider VARCHAR(150) NULL,
            reminder_days INT NOT NULL DEFAULT 30,
            notes TEXT NULL,
            created_by INT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "Table 'certificates' ready.\n";

    // Menu — open to all authenticated users, same pattern as Notes/Links/Projects
    $stmt = $pdo->prepare("SELECT id FROM menus WHERE path = '/dashboard/certificates'");
    $stmt->execute();
    if (!$stmt->fetch()) {
        $pdo->exec("INSERT INTO menus (name, path, icon, permission_key) VALUES ('Sertifikalar', '/dashboard/certificates', 'Certificates', NULL)");
        echo "Menu item 'Sertifikalar' added.\n";
    }

    echo "Certificates Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
