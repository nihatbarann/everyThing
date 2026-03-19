<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';

class MenuController {

    /**
     * GET /api/menus
     * Returns menus the authenticated user is authorized to see.
     */
    public function index() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            if ($auth->isAdmin($user)) {
                // Admin sees all menus
                $stmt = $pdo->query("SELECT id, name, path, icon, permission_key FROM menus ORDER BY id");
            } else {
                // Other users only see menus assigned to their role
                $stmt = $pdo->prepare(
                    "SELECT m.id, m.name, m.path, m.icon, m.permission_key
                     FROM menus m
                     JOIN role_menus rm ON rm.menu_id = m.id
                     WHERE rm.role_id = ?
                     ORDER BY m.id"
                );
                $stmt->execute([$user['role_id']]);
            }

            $menus = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['menus' => $menus]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
