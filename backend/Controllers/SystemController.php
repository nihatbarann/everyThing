<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';

class SystemController {
    
    public function optimize() {
        $user = $this->requireAdmin();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);

            $results = [];
            foreach($tables as $table) {
                // OPTIMIZE TABLE rebuilds the table and reclaims space
                $optStmt = $pdo->query("OPTIMIZE TABLE `$table`");
                $result = $optStmt->fetchAll();
                $results[$table] = $result[0]['Msg_text'] ?? 'OK';
            }

            echo json_encode([
                'success' => true, 
                'message' => 'Database optimization complete.',
                'details' => $results
            ]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * GET /api/system/config
     * Returns system configuration like theme.
     */
    public function getConfig() {
        $this->requireAdmin();
        $configFile = __DIR__ . '/../config/system.json';
        
        $config = ['theme' => 'light']; // Default
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true) ?: $config;
        }
        
        echo json_encode(['config' => $config]);
    }

    /**
     * PUT /api/system/config
     * Updates system configuration.
     */
    public function updateConfig() {
        $this->requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true);
        $configFile = __DIR__ . '/../config/system.json';
        
        $config = ['theme' => 'light'];
        if (file_exists($configFile)) {
            $config = json_decode(file_get_contents($configFile), true) ?: $config;
        }

        if (isset($data['theme'])) {
            $config['theme'] = $data['theme'];
        }

        file_put_contents($configFile, json_encode($config, JSON_PRETTY_PRINT));
        echo json_encode(['success' => true, 'config' => $config]);
    }

    /**
     * GET /api/system/db-info
     * Returns SQL connection details (masked password).
     */
    public function getDbInfo() {
        $this->requireAdmin();
        $dbConfig = require __DIR__ . '/../config/database.php';
        
        // Mask password for safety
        $dbConfig['password'] = '********';
        
        echo json_encode(['dbInfo' => $dbConfig]);
    }

    /**
     * GET /api/system/export-db
     * Triggers a database export. This is a basic backup mechanism.
     */
    public function exportDb() {
        $this->requireAdmin();
        
        try {
            $pdo = Database::getConnection();
            $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
            
            $sql = "-- EveryThing System Database Backup\n";
            $sql .= "-- Date: " . date('Y-m-d H:i:s') . "\n\n";
            
            foreach ($tables as $table) {
                $createStmt = $pdo->query("SHOW CREATE TABLE `$table`")->fetch(PDO::FETCH_ASSOC);
                $sql .= "-- Table: $table\n";
                $sql .= "DROP TABLE IF EXISTS `$table`;\n";
                $sql .= $createStmt['Create Table'] . ";\n\n";
                
                $rows = $pdo->query("SELECT * FROM `$table`")->fetchAll(PDO::FETCH_ASSOC);
                if (!empty($rows)) {
                    $sql .= "-- Data for $table\n";
                    foreach ($rows as $row) {
                        $keys = array_keys($row);
                        $values = array_map(function($value) use ($pdo) {
                            if ($value === null) return 'NULL';
                            return $pdo->quote($value);
                        }, array_values($row));
                        
                        $sql .= "INSERT INTO `$table` (`" . implode("`, `", $keys) . "`) VALUES (" . implode(", ", $values) . ");\n";
                    }
                    $sql .= "\n";
                }
            }
            
            header('Content-Type: text/plain');
            header('Content-Disposition: attachment; filename="everything_backup_' . date('Ymd_His') . '.sql"');
            echo $sql;
            
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Export failed: ' . $e->getMessage()]);
        }
    }

    private function requireAdmin() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        
        if ($user['role_name'] !== 'Admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden - Admin access required']);
            exit();
        }
        return $user;
    }
}
