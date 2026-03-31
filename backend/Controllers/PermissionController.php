<?php

class PermissionController {
    
    /**
     * GET /api/permissions
     * Returns all available permissions in the system.
     */
    public function index() {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query("SELECT id, `key`, name, description FROM permissions ORDER BY id");
            $permissions = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['permissions' => $permissions]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database error', 'details' => $e->getMessage()]);
        }
    }
}
