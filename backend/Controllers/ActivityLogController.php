<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/../Core/Database.php';

class ActivityLogController {

    /**
     * GET /api/activity-logs?page=1&limit=20&search=
     * Admin-only: returns paginated activity logs.
     */
    public function index() {
        $auth = new AuthMiddleware();
        $userData = $auth->verifyToken();

        if (!$auth->isAdmin($userData)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: admin access required']);
            return;
        }

        try {
            $pdo = Database::getConnection();

            $page = max(1, intval($_GET['page'] ?? 1));
            $limit = min(100, max(1, intval($_GET['limit'] ?? 20)));
            $search = trim($_GET['search'] ?? '');
            $offset = ($page - 1) * $limit;

            $where = '';
            $params = [];

            if ($search) {
                $where = "WHERE (al.username LIKE ? OR al.action LIKE ? OR al.description LIKE ? OR al.ip_address LIKE ?)";
                $searchTerm = "%{$search}%";
                $params = [$searchTerm, $searchTerm, $searchTerm, $searchTerm];
            }

            // Count total
            $countSql = "SELECT COUNT(*) FROM activity_logs al {$where}";
            $countStmt = $pdo->prepare($countSql);
            $countStmt->execute($params);
            $total = intval($countStmt->fetchColumn());

            // Fetch logs
            $sql = "SELECT al.id, al.user_id, al.username, al.action, al.description,
                           al.target_type, al.target_id, al.ip_address, al.created_at
                    FROM activity_logs al
                    {$where}
                    ORDER BY al.created_at DESC
                    LIMIT {$limit} OFFSET {$offset}";

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'logs' => $logs,
                'pagination' => [
                    'total' => $total,
                    'page' => $page,
                    'limit' => $limit,
                    'totalPages' => ceil($total / $limit)
                ]
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to fetch logs']);
        }
    }

    /**
     * Static helper: record an activity log entry.
     * Call from any controller: ActivityLogController::log(...)
     */
    public static function log($userId, $username, $action, $description = '', $targetType = null, $targetId = null) {
        try {
            $pdo = Database::getConnection();

            $ip = $_SERVER['REMOTE_ADDR'] ?? ($_SERVER['HTTP_X_FORWARDED_FOR'] ?? 'unknown');
            $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

            $stmt = $pdo->prepare(
                "INSERT INTO activity_logs (user_id, username, action, description, target_type, target_id, ip_address, user_agent)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([$userId, $username, $action, $description, $targetType, $targetId, $ip, $ua]);

        } catch (Exception $e) {
            // Silently fail — logging should never break the main operation
        }
    }
}
