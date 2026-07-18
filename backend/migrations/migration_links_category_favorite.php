<?php

require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->query("SHOW COLUMNS FROM links LIKE 'category'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE links ADD COLUMN category VARCHAR(50) NULL AFTER title");
        echo "Successfully added 'category' column to 'links' table.\n";
    } else {
        echo "Column 'category' already exists.\n";
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM links LIKE 'is_favorite'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE links ADD COLUMN is_favorite TINYINT(1) NOT NULL DEFAULT 0 AFTER notes");
        echo "Successfully added 'is_favorite' column to 'links' table.\n";
    } else {
        echo "Column 'is_favorite' already exists.\n";
    }

} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
