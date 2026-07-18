<?php
require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class LinkController {

    private function requireAuth() {
        $auth = new AuthMiddleware();
        return $auth->verifyToken();
    }

    public function index() {
        $user = $this->requireAuth();
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT * FROM links WHERE user_id = ? ORDER BY is_favorite DESC, title ASC");
            $stmt->execute([$user['user_id']]);
            echo json_encode(['links' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    public function create() {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $title = trim($data['title'] ?? 'Yeni Link');
        $category = trim($data['category'] ?? '') ?: null;
        $url = trim($data['url'] ?? '');
        $username = $data['username'] ?? '';
        $password = $data['password'] ?? '';
        $notes = $data['notes'] ?? '';
        $isFavorite = !empty($data['is_favorite']) ? 1 : 0;

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("INSERT INTO links (user_id, title, category, url, username, password, notes, is_favorite) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([$user['user_id'], $title, $category, $url, $username, $password, $notes, $isFavorite]);
            
            $newId = $pdo->lastInsertId();
            ActivityLogController::log($user['user_id'], $user['username'], 'link.create', "Created link \"{$title}\"", 'link', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    public function update($id) {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();
            $check = $pdo->prepare("SELECT id FROM links WHERE id = ? AND user_id = ?");
            $check->execute([$id, $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                return;
            }

            $stmt = $pdo->prepare("UPDATE links SET title=?, category=?, url=?, username=?, password=?, notes=?, is_favorite=? WHERE id=?");
            $stmt->execute([
                trim($data['title'] ?? ''),
                trim($data['category'] ?? '') ?: null,
                trim($data['url'] ?? ''),
                $data['username'] ?? '',
                $data['password'] ?? '',
                $data['notes'] ?? '',
                !empty($data['is_favorite']) ? 1 : 0,
                $id
            ]);
            
            ActivityLogController::log($user['user_id'], $user['username'], 'link.update', "Updated link ID {$id}", 'link', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
        }
    }

    public function delete($id) {
        $user = $this->requireAuth();
        try {
            $pdo = Database::getConnection();
            $check = $pdo->prepare("SELECT id FROM links WHERE id = ? AND user_id = ?");
            $check->execute([$id, $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                return;
            }

            $stmt = $pdo->prepare("DELETE FROM links WHERE id = ?");
            $stmt->execute([$id]);
            
            ActivityLogController::log($user['user_id'], $user['username'], 'link.delete', "Deleted link ID {$id}", 'link', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
        }
    }
}
