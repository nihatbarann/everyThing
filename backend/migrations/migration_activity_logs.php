<?php
/**
 * Migration: Create activity_logs table
 * Run via: php migration_activity_logs.php
 */
$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to database.\n\n";

    $statements = [
        "CREATE TABLE IF NOT EXISTS activity_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NULL,
            username VARCHAR(100) NULL,
            action VARCHAR(100) NOT NULL,
            description TEXT NULL,
            target_type VARCHAR(50) NULL,
            target_id INT NULL,
            ip_address VARCHAR(45) NULL,
            user_agent TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_logs_user_id (user_id),
            INDEX idx_logs_action (action),
            INDEX idx_logs_created_at (created_at),
            INDEX idx_logs_target (target_type, target_id)
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
