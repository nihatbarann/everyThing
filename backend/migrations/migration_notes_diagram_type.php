<?php

require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->query("SHOW COLUMNS FROM notes LIKE 'type'");
    $exists = $stmt->fetch();

    if (!$exists) {
        $pdo->exec("ALTER TABLE notes ADD COLUMN type ENUM('text', 'diagram') NOT NULL DEFAULT 'text' AFTER title");
        $pdo->exec("ALTER TABLE notes MODIFY COLUMN content LONGTEXT");
        echo "Successfully added 'type' column and widened 'content' column on 'notes' table.\n";
    } else {
        echo "Column 'type' already exists.\n";
    }

} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
