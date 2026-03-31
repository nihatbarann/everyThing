<?php

class AuthMiddleware {
    private $secretKey;

    public function __construct() {
        $this->secretKey = getenv('JWT_SECRET') ?: 'EveryThing_Super_Secret_Key_Change_In_Prod';
    }

    /**
     * Verify JWT token and return user payload.
     * Exits with 401 if invalid.
     */
    public function verifyToken() {
        $authHeader = '';
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
        } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $authHeader = $headers['Authorization'];
            }
        }
        
        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            $jwt = $matches[1];
            $tokenParts = explode('.', $jwt);
            
            if(count($tokenParts) != 3) {
                $this->unauthorized();
            }

            $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
            $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
            $signatureProvided = $tokenParts[2];

            $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
            $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
            $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secretKey, true);
            $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

            if (hash_equals($base64UrlSignature, $signatureProvided)) {
                $payloadData = json_decode($payload, true);
                if($payloadData['exp'] > time()) {
                    return $payloadData;
                }
            }
        }
        
        $this->unauthorized();
    }

    /**
     * Check if the authenticated user has a specific permission.
     * Returns true/false without exiting.
     */
    public function hasPermission($userId, $permissionKey) {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT COUNT(*) FROM user_permissions up
                 JOIN permissions p ON up.permission_id = p.id
                 JOIN users u ON u.id = up.user_id
                 WHERE u.id = ? AND p.`key` = ? AND u.deleted_at IS NULL"
            );
            $stmt->execute([$userId, $permissionKey]);
            return $stmt->fetchColumn() > 0;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Require a specific permission. Exits with 403 if not authorized.
     */
    public function requirePermission($userId, $permissionKey) {
        if (!$this->hasPermission($userId, $permissionKey)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden: missing permission ' . $permissionKey]);
            exit();
        }
    }

    /**
     * Check if user is admin (role_name = 'Admin').
     */
    public function isAdmin($userData) {
        return isset($userData['role_name']) && $userData['role_name'] === 'Admin';
    }

    /**
     * Get all permission keys for a user.
     */
    public function getUserPermissions($userId) {
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT p.`key` FROM permissions p
                 JOIN user_permissions up ON up.permission_id = p.id
                 JOIN users u ON u.id = up.user_id
                 WHERE u.id = ? AND u.deleted_at IS NULL"
            );
            $stmt->execute([$userId]);
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * Get all subordinate IDs for a manager (recursive).
     */
    public function getSubordinateIds($managerId) {
        try {
            $pdo = Database::getConnection();
            $ids = [];
            $queue = [$managerId];

            while (!empty($queue)) {
                $currentId = array_shift($queue);
                $stmt = $pdo->prepare(
                    "SELECT id FROM users WHERE manager_id = ? AND deleted_at IS NULL"
                );
                $stmt->execute([$currentId]);
                $children = $stmt->fetchAll(PDO::FETCH_COLUMN);
                foreach ($children as $childId) {
                    $ids[] = $childId;
                    $queue[] = $childId;
                }
            }

            return $ids;
        } catch (Exception $e) {
            return [];
        }
    }

    private function unauthorized() {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
}
