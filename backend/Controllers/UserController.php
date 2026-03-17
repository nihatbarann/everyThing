<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';

class UserController {
    
    public function index() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        
        if($user['role_name'] !== 'Admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query("SELECT u.id, u.username, r.name as role_name 
                                 FROM users u 
                                 JOIN roles r ON u.role_id = r.id");
            $users = $stmt->fetchAll();
            echo json_encode(['users' => $users]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    public function create() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        
        if($user['role_name'] !== 'Admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if(!isset($data['username']) || !isset($data['password']) || !isset($data['role_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing fields']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$data['username']]);
            if($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Username already exists']);
                return;
            }

            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)");
            $stmt->execute([$data['username'], $passwordHash, $data['role_id']]);
            
            echo json_encode(['success' => true]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    public function delete($id) {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        
        if($user['role_name'] !== 'Admin') {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        if($user['user_id'] == $id) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete yourself']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            echo json_encode(['success' => true]);
        } catch(Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
