<?php

class AuthController {
    
    // JWT_SECRET must be set as an Apache/PHP environment variable (e.g. in .htaccess or server config).
    // Never hard-code a real secret here — it would be exposed in version control.
    private $secretKey;

    public function __construct() {
        // Read the secret from the server environment.
        // Set this via Apache: SetEnv JWT_SECRET "your-long-random-string"
        $this->secretKey = getenv('JWT_SECRET') ?: 'change-this-in-production-' . gethostname();
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['username']) || !isset($data['password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username and password required']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT u.id, u.username, u.password, u.role_id, r.name as role_name 
                                 FROM users u 
                                 JOIN roles r ON u.role_id = r.id 
                                 WHERE u.username = ?");
            $stmt->execute([$data['username']]);
            $user = $stmt->fetch();

            if ($user && password_verify($data['password'], $user['password'])) {
                // Generate JWT
                $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
                $payload = json_encode([
                    'user_id' => $user['id'],
                    'username' => $user['username'],
                    'role_id' => $user['role_id'],
                    'role_name' => $user['role_name'],
                    'exp' => time() + (60 * 60 * 24) // 24 hours
                ]);

                $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
                $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
                $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $this->secretKey, true);
                $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));
                $jwt = $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;

                echo json_encode([
                    'success' => true,
                    'token' => $jwt,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'role' => $user['role_name']
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
}
