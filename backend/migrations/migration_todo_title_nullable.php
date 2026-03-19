<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    // Make title column nullable
    $pdo->exec("ALTER TABLE todos MODIFY COLUMN title VARCHAR(255) NULL");
    echo "Successfully modified 'title' column to be nullable in 'todos' table.\n";

} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
