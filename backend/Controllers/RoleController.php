<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';

class RoleController {

    /**
     * GET /api/roles
     * List all roles (for dropdowns).
     */
    public function index() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query("SELECT id, name FROM roles ORDER BY id");
            $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['roles' => $roles]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/roles/{id}/permissions
     * Get permissions assigned to a role.
     */
    public function getPermissions($roleId) {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();

        if (!$auth->isAdmin($user)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        try {
            $pdo = Database::getConnection();

            // All available permissions
            $allStmt = $pdo->query("SELECT id, `key`, name, description FROM permissions ORDER BY id");
            $allPermissions = $allStmt->fetchAll(PDO::FETCH_ASSOC);

            // Assigned permission IDs for this role
            $assignedStmt = $pdo->prepare("SELECT permission_id FROM role_permissions WHERE role_id = ?");
            $assignedStmt->execute([$roleId]);
            $assignedIds = $assignedStmt->fetchAll(PDO::FETCH_COLUMN);

            echo json_encode([
                'permissions' => $allPermissions,
                'assigned' => $assignedIds
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/roles/{id}/permissions
     * Update role permissions (admin only).
     * Body: { "permission_ids": [1, 2, 3] }
     */
    public function updatePermissions($roleId) {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();

        if (!$auth->isAdmin($user)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['permission_ids']) || !is_array($data['permission_ids'])) {
            http_response_code(400);
            echo json_encode(['error' => 'permission_ids array required']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $pdo->beginTransaction();

            // Clear existing permissions for this role
            $stmt = $pdo->prepare("DELETE FROM role_permissions WHERE role_id = ?");
            $stmt->execute([$roleId]);

            // Insert new permissions
            $insert = $pdo->prepare("INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)");
            foreach ($data['permission_ids'] as $permId) {
                $insert->execute([$roleId, (int)$permId]);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'message' => 'Permissions updated']);
        } catch (Exception $e) {
            $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
