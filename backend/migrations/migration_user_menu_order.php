<?php
/**
 * Migration: Create user_menu_order table
 * Run via: php migration_user_menu_order.php
 */
$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to database.\n\n";

    $statements = [
        "CREATE TABLE IF NOT EXISTS user_menu_order (
            user_id INT NOT NULL PRIMARY KEY,
            menu_order JSON NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    ];

    $ok = 0;
    $skip = 0;
    foreach ($statements as $i => $sql) {
        try {
            $pdo->exec($sql);
            $ok++;
            echo "  [OK]   #" . ($i+1) . ": " . substr(trim($sql), 0, 70) . "...\n";
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (strpos($msg, 'already exists') !== false) {
                $skip++;
                echo "  [SKIP] #" . ($i+1) . ": Already done\n";
            } else {
                echo "  [ERR]  #" . ($i+1) . ": $msg\n";
            }
        }
    }

    echo "\nDone: $ok executed, $skip skipped.\n";

} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
