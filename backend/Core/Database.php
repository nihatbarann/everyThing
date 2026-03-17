<?php

class Database {
    private static $pdo = null;

    public static function getConnection() {
        if (self::$pdo === null) {
            $configFile = __DIR__ . '/../config/database.php';
            if (!file_exists($configFile)) {
                throw new Exception("Database configuration not found. Please run installation.");
            }
            $config = require $configFile;
            
            $dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";
            try {
                self::$pdo = new PDO($dsn, $config['username'], $config['password']);
                self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(['error' => 'Database connection failed.']);
                exit();
            }
        }
        return self::$pdo;
    }
}
