<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

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

            // Fetch all menus
            $stmt = $pdo->query("SELECT id, name, path, icon, permission_key FROM menus ORDER BY id");
            $allMenus = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch user permissions
            $userPermissions = $auth->getUserPermissions($user['user_id']);

            // Filter menus
            $menus = [];
            foreach ($allMenus as $menu) {
                if (empty($menu['permission_key']) || in_array($menu['permission_key'], $userPermissions)) {
                    $menus[] = $menu;
                }
            }

            // Fetch custom order for this user
            $orderStmt = $pdo->prepare("SELECT menu_order FROM user_menu_order WHERE user_id = ?");
            $orderStmt->execute([$user['user_id']]);
            $customOrderJson = $orderStmt->fetchColumn();

            if ($customOrderJson) {
                $customOrder = json_decode($customOrderJson, true);
                if (is_array($customOrder) && !empty($customOrder)) {
                    // Sort $menus according to the $customOrder array of IDs
                    // Items not in $customOrder go to the end
                    $orderMap = array_flip($customOrder);
                    usort($menus, function($a, $b) use ($orderMap) {
                        $idxA = isset($orderMap[$a['id']]) ? $orderMap[$a['id']] : 999999;
                        $idxB = isset($orderMap[$b['id']]) ? $orderMap[$b['id']] : 999999;
                        
                        // If both have the same index (e.g., both are 999999 because they're not in the order map), fallback to ID sort
                        if ($idxA === $idxB) {
                            return $a['id'] <=> $b['id'];
                        }
                        return $idxA <=> $idxB;
                    });
                }
            }

            echo json_encode(['menus' => $menus]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/menus/order
     * Saves user's custom menu order.
     */
    public function saveOrder() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['menu_order']) || !is_array($data['menu_order'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid menu order data']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $orderJson = json_encode($data['menu_order']);

            // Insert or update
            $stmt = $pdo->prepare("
                INSERT INTO user_menu_order (user_id, menu_order) 
                VALUES (?, ?) 
                ON DUPLICATE KEY UPDATE menu_order = ?
            ");
            $stmt->execute([$user['user_id'], $orderJson, $orderJson]);

            ActivityLogController::log($user['user_id'], $user['username'], 'menu.reorder', 'Reordered sidebar menu');

            echo json_encode(['success' => true]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
