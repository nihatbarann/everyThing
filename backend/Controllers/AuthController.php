<?php

require_once __DIR__ . '/ActivityLogController.php';

class AuthController {
    
    private $secretKey;

    public function __construct() {
        $secret = getenv('JWT_SECRET');
        if (!$secret || strlen($secret) < 32) {
            $secret = 'EveryThing_Dev_Secret_Change_This_In_Production_Please_Min32';
        }
        $this->secretKey = $secret;
    }

    public function login() {
        try {
            $raw  = file_get_contents('php://input');
            $data = json_decode($raw, true);

            if (!isset($data['username']) || !isset($data['password'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Username and password required']);
                return;
            }
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT u.id, u.username, u.password, u.role_id, u.is_active, r.name as role_name 
                 FROM users u 
                 JOIN roles r ON u.role_id = r.id 
                 WHERE u.username = ? AND u.deleted_at IS NULL"
            );
            $stmt->execute([$data['username']]);
            $user = $stmt->fetch();

            if (!$user) {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
                return;
            }

            if (!$user['is_active']) {
                http_response_code(403);
                echo json_encode(['error' => 'Account is deactivated. Contact your administrator.']);
                return;
            }

            if (password_verify($data['password'], $user['password'])) {
                // Update last_login
                $updateStmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
                $updateStmt->execute([$user['id']]);

                // Get user permissions
                require_once __DIR__ . '/../Core/AuthMiddleware.php';
                $auth = new AuthMiddleware();
                $permissions = $auth->getUserPermissions($user['id']);

                // Generate JWT
                $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
                $payload = json_encode([
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'role_id' => $user['role_id'],
                    'role_name' => $user['role_name'],
                    'exp' => time() + (60 * 60 * 24)
                ]);

                $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
                $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
                $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secretKey, true);
                $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
                $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

                ActivityLogController::log($user['id'], $user['username'], 'auth.login', 'User logged in');

                echo json_encode([
                    'success' => true,
                    'token' => $jwt,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'role' => $user['role_name'],
                        'permissions' => $permissions
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['error' => 'Invalid credentials']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    public function me() {
        require_once __DIR__ . '/../Core/AuthMiddleware.php';
        $auth = new AuthMiddleware();
        $userData = $auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT u.*, r.name as role_name,
                 IFNULL(NULLIF(TRIM(CONCAT_WS(' ', m.first_name, m.last_name)), ''), m.username) as manager_name,
                 m.username as manager_username,
                 IFNULL(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''), c.username) as created_by_name,
                 c.username as created_by_username
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 LEFT JOIN users m ON u.manager_id = m.id
                 LEFT JOIN users c ON u.created_by = c.id
                 WHERE u.id = ? AND u.deleted_at IS NULL"
            );
            $stmt->execute([$userData['user_id']]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$profile) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }

            unset($profile['password']);
            $profile['role'] = $profile['role_name']; // Alias for legacy support
            $profile['permissions'] = $auth->getUserPermissions($userData['user_id']);

            echo json_encode(['user' => $profile]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
