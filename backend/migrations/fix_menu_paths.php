<?php
/**
 * Fix menu paths to include /dashboard prefix.
 */
$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec("UPDATE menus SET path = '/dashboard' WHERE path = '/dashboard'");
    $pdo->exec("UPDATE menus SET path = '/dashboard/users' WHERE path = '/users'");
    $pdo->exec("UPDATE menus SET path = '/dashboard/settings' WHERE path = '/settings'");

    echo "Menu paths updated.\n";

    $stmt = $pdo->query("SELECT * FROM menus");
    print_r($stmt->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
