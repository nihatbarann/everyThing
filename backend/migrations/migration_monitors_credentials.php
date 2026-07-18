<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    echo "Running Monitors Credentials Migration...\n";

    $stmt = $pdo->query("SHOW COLUMNS FROM monitors LIKE 'username'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE monitors ADD COLUMN username VARCHAR(255) NULL AFTER port");
        $pdo->exec("ALTER TABLE monitors ADD COLUMN password VARCHAR(255) NULL AFTER username");
        echo "Columns 'username' and 'password' added to 'monitors'.\n";
    } else {
        echo "Columns already exist.\n";
    }

    echo "Monitors Credentials Migration completed successfully.\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
