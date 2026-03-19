<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    // Check if priority column exists
    $stmt = $pdo->query("SHOW COLUMNS FROM todos LIKE 'priority'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $pdo->exec("ALTER TABLE todos ADD COLUMN priority ENUM('low', 'medium', 'high') DEFAULT 'medium' AFTER target_date");
        echo "Successfully added 'priority' column to 'todos' table.\n";
    } else {
        echo "Column 'priority' already exists.\n";
    }

} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
