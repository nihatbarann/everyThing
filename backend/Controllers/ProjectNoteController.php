<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class ProjectNoteController {

    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    private function canAccess(PDO $pdo, $projectId, $user) {
        if ($this->auth->isAdmin($user)) return true;

        $stmt = $pdo->prepare("SELECT id FROM projects WHERE id = ? AND created_by = ?");
        $stmt->execute([$projectId, $user['user_id']]);
        if ($stmt->fetch()) return true;

        $stmt = $pdo->prepare("SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?");
        $stmt->execute([$projectId, $user['user_id']]);
        return (bool) $stmt->fetch();
    }

    /**
     * GET /api/projects/{projectId}/notes
     */
    public function index($projectId) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $stmt = $pdo->prepare(
                "SELECT n.id, n.title, n.type, n.created_at, n.updated_at, u.username as creator_username
                 FROM project_notes n
                 LEFT JOIN users u ON u.id = n.created_by
                 WHERE n.project_id = ?
                 ORDER BY n.updated_at DESC"
            );
            $stmt->execute([$projectId]);
            echo json_encode(['notes' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/projects/{projectId}/notes/{id}
     */
    public function show($projectId, $id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $stmt = $pdo->prepare("SELECT * FROM project_notes WHERE id = ? AND project_id = ?");
            $stmt->execute([$id, $projectId]);
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
     * POST /api/projects/{projectId}/notes
     */
    public function create($projectId) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $title = trim($data['title'] ?? 'Yeni Not') ?: 'İsimsiz Not';
            $type = in_array($data['type'] ?? 'text', ['text', 'diagram'], true) ? $data['type'] : 'text';

            $stmt = $pdo->prepare("INSERT INTO project_notes (project_id, title, type, content, created_by) VALUES (?, ?, ?, ?, ?)");
            $stmt->execute([$projectId, $title, $type, $data['content'] ?? '', $user['user_id']]);
            $newId = $pdo->lastInsertId();

            ActivityLogController::log($user['user_id'], $user['username'], 'project_note.create', "Created project note \"{$title}\"", 'project_note', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/projects/{projectId}/notes/{id}
     */
    public function update($projectId, $id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $fields = [];
            $params = [];
            if (isset($data['title'])) { $fields[] = 'title = ?'; $params[] = substr(trim($data['title']), 0, 255); }
            if (isset($data['content'])) { $fields[] = 'content = ?'; $params[] = $data['content']; }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $params[] = $id;
            $params[] = $projectId;

            $stmt = $pdo->prepare("UPDATE project_notes SET " . implode(', ', $fields) . " WHERE id = ? AND project_id = ?");
            $stmt->execute($params);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/projects/{projectId}/notes/{id}
     */
    public function delete($projectId, $id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $pdo->prepare("DELETE FROM project_notes WHERE id = ? AND project_id = ?")->execute([$id, $projectId]);

            ActivityLogController::log($user['user_id'], $user['username'], 'project_note.delete', "Deleted project note ID {$id}", 'project_note', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
