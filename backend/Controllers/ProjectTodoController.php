<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class ProjectTodoController {

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
     * GET /api/projects/{projectId}/todos
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
                "SELECT t.*, u.username as assigned_username,
                        IFNULL(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) as assigned_name
                 FROM project_todos t
                 LEFT JOIN users u ON u.id = t.assigned_to
                 WHERE t.project_id = ?
                 ORDER BY t.created_at DESC"
            );
            $stmt->execute([$projectId]);
            echo json_encode(['todos' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/projects/{projectId}/todos
     */
    public function create($projectId) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Başlık zorunludur']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $statusInput = $data['status'] ?? 'todo';
            $status = in_array($statusInput, ['todo', 'in_progress', 'done'], true) ? $statusInput : 'todo';
            $priorityInput = $data['priority'] ?? 'medium';
            $priority = in_array($priorityInput, ['low', 'medium', 'high'], true) ? $priorityInput : 'medium';

            $stmt = $pdo->prepare(
                "INSERT INTO project_todos (project_id, title, description, status, priority, target_date, created_by, assigned_to, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $projectId,
                trim($data['title']),
                $data['description'] ?? null,
                $status,
                $priority,
                empty($data['target_date']) ? null : $data['target_date'],
                $user['user_id'],
                empty($data['assigned_to']) ? null : (int) $data['assigned_to'],
                empty($data['created_at']) ? date('Y-m-d H:i:s') : $data['created_at']
            ]);
            $newId = $pdo->lastInsertId();

            ActivityLogController::log($user['user_id'], $user['username'], 'project_todo.create', "Created project todo \"{$data['title']}\"", 'project_todo', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/projects/{projectId}/todos/{id}
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

            if (isset($data['title'])) { $fields[] = 'title = ?'; $params[] = trim($data['title']); }
            if (isset($data['description'])) { $fields[] = 'description = ?'; $params[] = $data['description']; }
            if (isset($data['status']) && in_array($data['status'], ['todo', 'in_progress', 'done'], true)) {
                $fields[] = 'status = ?'; $params[] = $data['status'];
            }
            if (isset($data['target_date'])) { $fields[] = 'target_date = ?'; $params[] = empty($data['target_date']) ? null : $data['target_date']; }
            if (!empty($data['created_at'])) { $fields[] = 'created_at = ?'; $params[] = $data['created_at']; }
            if (isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high'], true)) {
                $fields[] = 'priority = ?'; $params[] = $data['priority'];
            }
            if (array_key_exists('assigned_to', $data)) {
                $fields[] = 'assigned_to = ?'; $params[] = empty($data['assigned_to']) ? null : (int) $data['assigned_to'];
            }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            $params[] = $id;
            $params[] = $projectId;
            $stmt = $pdo->prepare("UPDATE project_todos SET " . implode(', ', $fields) . " WHERE id = ? AND project_id = ?");
            $stmt->execute($params);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/projects/{projectId}/todos/{id}/status
     */
    public function updateStatus($projectId, $id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['status']) || !in_array($data['status'], ['todo', 'in_progress', 'done'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $projectId, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $pdo->prepare("UPDATE project_todos SET status = ? WHERE id = ? AND project_id = ?")
                ->execute([$data['status'], $id, $projectId]);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/projects/{projectId}/todos/{id}
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

            $pdo->prepare("DELETE FROM project_todos WHERE id = ? AND project_id = ?")->execute([$id, $projectId]);

            ActivityLogController::log($user['user_id'], $user['username'], 'project_todo.delete', "Deleted project todo ID {$id}", 'project_todo', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
