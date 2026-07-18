<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class TodoController {

    private function requireAuth() {
        $auth = new AuthMiddleware();
        $user = $auth->verifyToken();
        
        // Removed permission check since everyone should access Todos
        return $user;
    }

    /**
     * GET /api/todos
     * Returns todos where the user is either the creator or it is assigned to them.
     */
    public function index() {
        $user = $this->requireAuth();
        
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT t.*, u.username as creator_username, u.first_name as creator_fn, u.last_name as creator_ln 
                 FROM todos t
                 LEFT JOIN users u ON t.creator_id = u.id
                 WHERE (t.creator_id = ? OR t.assigned_to = ?) AND t.is_archived = 0
                 ORDER BY t.created_at DESC"
            );
            $stmt->execute([$user['user_id'], $user['user_id']]);
            $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['todos' => $todos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/todos
     */
    public function create() {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (empty($data['description']) && empty($data['title'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Description is required.']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "INSERT INTO todos (title, description, status, creator_id, assigned_to, target_date, priority, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );

            $status = $data['status'] ?? 'todo';
            if (!in_array($status, ['todo', 'in_progress', 'done'])) {
                $status = 'todo';
            }

            $stmt->execute([
                $data['title'] ?? null,
                $data['description'] ?? null,
                $status,
                $user['user_id'],
                $data['assigned_to'] ?? $user['user_id'], // Default assign to self
                empty($data['target_date']) ? null : $data['target_date'],
                $data['priority'] ?? 'medium',
                empty($data['created_at']) ? date('Y-m-d H:i:s') : $data['created_at']
            ]);
            
            $newId = $pdo->lastInsertId();
            $title = $data['title'] ?? 'Untitled';
            ActivityLogController::log($user['user_id'], $user['username'], 'todo.create', "Created todo \"{$title}\"", 'todo', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            file_put_contents(__DIR__ . '/../error.log', $e->getMessage() . "\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/todos/{id}
     */
    public function update($id) {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();
            
            // Check ownership/assignment
            $check = $pdo->prepare("SELECT id FROM todos WHERE id = ? AND (creator_id = ? OR assigned_to = ?)");
            $check->execute([$id, $user['user_id'], $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Not authorized to edit this todo']);
                return;
            }

            $fields = [];
            $params = [];

            if (isset($data['title'])) {
                $fields[] = 'title = ?';
                $params[] = $data['title'];
            }
            if (isset($data['description'])) {
                $fields[] = 'description = ?';
                $params[] = $data['description'];
            }
            if (isset($data['status']) && in_array($data['status'], ['todo', 'in_progress', 'done'])) {
                $fields[] = 'status = ?';
                $params[] = $data['status'];
            }
            if (isset($data['target_date'])) {
                $fields[] = 'target_date = ?';
                $params[] = empty($data['target_date']) ? null : $data['target_date'];
            }
            if (!empty($data['created_at'])) {
                $fields[] = 'created_at = ?';
                $params[] = $data['created_at'];
            }
            if (isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high'])) {
                $fields[] = 'priority = ?';
                $params[] = $data['priority'];
            }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            $params[] = $id;
            
            $sql = "UPDATE todos SET " . implode(', ', $fields) . " WHERE id = ?";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            ActivityLogController::log($user['user_id'], $user['username'], 'todo.update', "Updated todo ID {$id}", 'todo', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/todos/{id}/status
     * Fast endpoint just for drag-and-drop status changes
     */
    public function updateStatus($id) {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['status']) || !in_array($data['status'], ['todo', 'in_progress', 'done'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid status']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            
            $check = $pdo->prepare("SELECT id FROM todos WHERE id = ? AND (creator_id = ? OR assigned_to = ?)");
            $check->execute([$id, $user['user_id'], $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Not authorized to edit this todo']);
                return;
            }

            $stmt = $pdo->prepare("UPDATE todos SET status = ? WHERE id = ?");
            $stmt->execute([$data['status'], $id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'todo.update_status', "Updated status to {$data['status']} for todo ID {$id}", 'todo', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/todos/{id}
     */
    public function delete($id) {
        $user = $this->requireAuth();

        try {
            $pdo = Database::getConnection();
            
            $check = $pdo->prepare("SELECT id FROM todos WHERE id = ? AND creator_id = ?");
            $check->execute([$id, $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Only the creator can delete this todo']);
                return;
            }

            $stmt = $pdo->prepare("DELETE FROM todos WHERE id = ?");
            $stmt->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'todo.delete', "Deleted todo ID {$id}", 'todo', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/todos/{id}/archive
     */
    public function archive($id) {
        $user = $this->requireAuth();

        try {
            $pdo = Database::getConnection();
            $check = $pdo->prepare("SELECT id FROM todos WHERE id = ? AND (creator_id = ? OR assigned_to = ?)");
            $check->execute([$id, $user['user_id'], $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Not authorized to archive this todo']);
                return;
            }

            $stmt = $pdo->prepare("UPDATE todos SET is_archived = 1 WHERE id = ?");
            $stmt->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'todo.archive', "Archived todo ID {$id}", 'todo', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/todos/{id}/unarchive
     */
    public function unarchive($id) {
        $user = $this->requireAuth();

        try {
            $pdo = Database::getConnection();
            $check = $pdo->prepare("SELECT id FROM todos WHERE id = ? AND (creator_id = ? OR assigned_to = ?)");
            $check->execute([$id, $user['user_id'], $user['user_id']]);
            if (!$check->fetch()) {
                http_response_code(403);
                echo json_encode(['error' => 'Not authorized to unarchive this todo']);
                return;
            }

            $stmt = $pdo->prepare("UPDATE todos SET is_archived = 0 WHERE id = ?");
            $stmt->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'todo.unarchive', "Unarchived todo ID {$id}", 'todo', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/todos/archived
     */
    public function archived() {
        $user = $this->requireAuth();
        
        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT t.*, u.username as creator_username, u.first_name as creator_fn, u.last_name as creator_ln 
                 FROM todos t
                 LEFT JOIN users u ON t.creator_id = u.id
                 WHERE (t.creator_id = ? OR t.assigned_to = ?) AND t.is_archived = 1
                 ORDER BY t.created_at DESC"
            );
            $stmt->execute([$user['user_id'], $user['user_id']]);
            $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['todos' => $todos]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
