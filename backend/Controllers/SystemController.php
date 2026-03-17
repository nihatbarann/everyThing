<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';

class SystemController {
    
    public function optimize() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        
        if($user['role_name'] !== 'Admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

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
}
