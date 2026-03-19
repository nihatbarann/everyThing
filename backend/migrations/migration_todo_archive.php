<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    // Add is_archived column if it doesn't exist
    $stmt = $pdo->query("SHOW COLUMNS FROM todos LIKE 'is_archived'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $pdo->exec("ALTER TABLE todos ADD COLUMN is_archived TINYINT(1) DEFAULT 0 AFTER status");
        echo "Successfully added 'is_archived' column to 'todos' table.\n";
    } else {
        echo "Column 'is_archived' already exists.\n";
    }

} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
