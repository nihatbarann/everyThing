<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class NoteController {

    private function requireAuth() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        // Notes are personal, all authenticated users have access to their own notes.
        return $user;
    }

    /**
     * GET /api/notes
     * List all notes belonging to the logged-in user
     */
    public function index() {
        $user = $this->requireAuth();
        
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT id, title, created_at, updated_at 
                 FROM notes 
                 WHERE user_id = ? 
                 ORDER BY updated_at DESC"
            );
            $stmt->execute([$user['user_id']]);
            $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['notes' => $notes]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/notes/{id}
     * Get single note for reading/editing
     */
    public function show($id) {
        $user = $this->requireAuth();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user['user_id']]);
            $note = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$note) {
                http_response_code(404);
                echo json_encode(['error' => 'Not bulunamadı']);
                return;
            }
            
            echo json_encode(['note' => $note]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/notes
     * Create a new note
     */
    public function create() {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $title = trim($data['title'] ?? 'Yeni Not');
        $content = $data['content'] ?? '';

        if (empty($title)) {
            $title = 'İsimsiz Not';
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)");
            $stmt->execute([$user['user_id'], $title, $content]);
            
            $newId = $pdo->lastInsertId();
            ActivityLogController::log($user['user_id'], $user['username'], 'note.create', "Created note \"{$title}\"", 'note', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/notes/{id}
     * Update an existing note
     */
    public function update($id) {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();
            
            // Check ownership
            $check = $pdo->prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?");
            $check->execute([$id, $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Not yetkisi yok']);
                return;
            }

            $fields = [];
            $params = [];

            if (isset($data['title'])) {
                $fields[] = 'title = ?';
                $params[] = substr(trim($data['title']), 0, 255);
            }
            if (isset($data['content'])) {
                $fields[] = 'content = ?';
                $params[] = $data['content'];
            }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            // Always update timestamp
            $fields[] = 'updated_at = NOW()';

            $params[] = $id;
            
            $sql = "UPDATE notes SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            ActivityLogController::log($user['user_id'], $user['username'], 'note.update', "Updated note ID {$id}", 'note', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/notes/{id}
     * Delete a note
     */
    public function delete($id) {
        $user = $this->requireAuth();

        try {
            $pdo = Database::getConnection();
            
            // Check ownership
            $check = $pdo->prepare("SELECT id FROM notes WHERE id = ? AND user_id = ?");
            $check->execute([$id, $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Not yetkisi yok']);
                return;
            }

            $stmt = $pdo->prepare("DELETE FROM notes WHERE id = ?");
            $stmt->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'note.delete', "Deleted note ID {$id}", 'note', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
