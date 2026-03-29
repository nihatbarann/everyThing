<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/ActivityLogController.php';

class AnnouncementController {
    
    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    /**
     * GET /api/announcements
     * Returns all active announcements, sorted by created_at DESC.
     */
    public function index() {
        $user = $this->auth->verifyToken(); // Must be logged in

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query(
                "SELECT a.id, a.title, a.short_description, a.priority, a.is_published, a.view_count, a.created_at, a.updated_at,
                 u.username as created_by_username, IFNULL(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) as created_by_name
                 FROM announcements a
                 JOIN users u ON a.created_by = u.id
                 WHERE a.deleted_at IS NULL
                 ORDER BY a.created_at DESC"
            );
            $announcements = $stmt->fetchAll();
            echo json_encode(['success' => true, 'announcements' => $announcements]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * GET /api/announcements/latest
     * Returns the latest 5 published announcements for the dashboard.
     */
    public function latest() {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query(
                "SELECT a.id, a.title, a.short_description, a.priority, a.created_at,
                 u.username as created_by_username, IFNULL(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) as created_by_name
                 FROM announcements a
                 JOIN users u ON a.created_by = u.id
                 WHERE a.deleted_at IS NULL AND a.is_published = 1
                 ORDER BY a.created_at DESC
                 LIMIT 5"
            );
            $announcements = $stmt->fetchAll();
            echo json_encode(['success' => true, 'announcements' => $announcements]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * GET /api/announcements/{id}
     * Returns the full content of an announcement and increments view_count.
     */
    public function show($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            
            // Increment view count
            $updateStmt = $pdo->prepare("UPDATE announcements SET view_count = view_count + 1 WHERE id = ? AND deleted_at IS NULL");
            $updateStmt->execute([$id]);

            $stmt = $pdo->prepare(
                "SELECT a.*, 
                 u.username as created_by_username, IFNULL(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) as created_by_name
                 FROM announcements a
                 JOIN users u ON a.created_by = u.id
                 WHERE a.id = ? AND a.deleted_at IS NULL"
            );
            $stmt->execute([$id]);
            $announcement = $stmt->fetch();

            if (!$announcement) {
                http_response_code(404);
                echo json_encode(['error' => 'Announcement not found']);
                return;
            }

            echo json_encode(['success' => true, 'announcement' => $announcement]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * POST /api/announcements
     * Create a new announcement (Requires permission)
     */
    public function create() {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'announcement_manage');

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['title']) || empty($data['short_description']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title, short description, and content are required']);
            return;
        }

        $priority = $data['priority'] ?? 'low';
        $is_published = isset($data['is_published']) ? (int)$data['is_published'] : 1;

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "INSERT INTO announcements (title, short_description, content, priority, is_published, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                trim($data['title']),
                trim($data['short_description']),
                trim($data['content']),
                $priority,
                $is_published,
                $user['user_id']
            ]);

            $newId = $pdo->lastInsertId();
            $title = trim($data['title']);
            ActivityLogController::log($user['user_id'], $user['username'], 'announcement.create', "Created announcement \"{$title}\"", 'announcement', $newId);

            echo json_encode(['success' => true, 'message' => 'Announcement created successfully', 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/announcements/{id}
     * Update an announcement (Requires permission)
     */
    public function update($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'announcement_manage');

        $data = json_decode(file_get_contents('php://input'), true);

        if (empty($data['title']) || empty($data['short_description']) || empty($data['content'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Title, short description, and content are required']);
            return;
        }

        $priority = $data['priority'] ?? 'low';
        $is_published = isset($data['is_published']) ? (int)$data['is_published'] : 1;

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "UPDATE announcements 
                 SET title = ?, short_description = ?, content = ?, priority = ?, is_published = ?
                 WHERE id = ? AND deleted_at IS NULL"
            );
            $stmt->execute([
                trim($data['title']),
                trim($data['short_description']),
                trim($data['content']),
                $priority,
                $is_published,
                $id
            ]);

            if ($stmt->rowCount() === 0) {
                // Check if exists
                $checkStmt = $pdo->prepare("SELECT id FROM announcements WHERE id = ? AND deleted_at IS NULL");
                $checkStmt->execute([$id]);
                if (!$checkStmt->fetch()) {
                    http_response_code(404);
                    echo json_encode(['error' => 'Announcement not found']);
                    return;
                }
            }

            ActivityLogController::log($user['user_id'], $user['username'], 'announcement.update', "Updated announcement ID {$id}", 'announcement', $id);

            echo json_encode(['success' => true, 'message' => 'Announcement updated successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/announcements/{id}
     * Soft delete an announcement (Requires permission)
     */
    public function delete($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'announcement_manage');

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("UPDATE announcements SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'Announcement not found or already deleted']);
                return;
            }

            ActivityLogController::log($user['user_id'], $user['username'], 'announcement.delete', "Deleted announcement ID {$id}", 'announcement', $id);

            echo json_encode(['success' => true, 'message' => 'Announcement deleted successfully']);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }
}
