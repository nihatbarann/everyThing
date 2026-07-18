<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class ProjectController {

    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    /**
     * True if the user created the project, is an assigned member, or is an Admin.
     */
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
     * GET /api/projects
     * Projects the user created or is a member of (all projects for Admin).
     */
    public function index() {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            if ($this->auth->isAdmin($user)) {
                $stmt = $pdo->query(
                    "SELECT p.*, (SELECT COUNT(*) FROM project_members pm WHERE pm.project_id = p.id) as member_count
                     FROM projects p ORDER BY p.end_date IS NULL, p.end_date ASC, p.created_at DESC"
                );
            } else {
                $stmt = $pdo->prepare(
                    "SELECT DISTINCT p.*, (SELECT COUNT(*) FROM project_members pm2 WHERE pm2.project_id = p.id) as member_count
                     FROM projects p
                     LEFT JOIN project_members pm ON pm.project_id = p.id
                     WHERE p.created_by = ? OR pm.user_id = ?
                     ORDER BY p.end_date IS NULL, p.end_date ASC, p.created_at DESC"
                );
                $stmt->execute([$user['user_id'], $user['user_id']]);
            }

            echo json_encode(['projects' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/projects/{id}
     * Project details + member list.
     */
    public function show($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Bu projeye erişim yetkiniz yok']);
                return;
            }

            $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$project) {
                http_response_code(404);
                echo json_encode(['error' => 'Proje bulunamadı']);
                return;
            }

            $membersStmt = $pdo->prepare(
                "SELECT u.id, u.username, u.first_name, u.last_name
                 FROM project_members pm
                 JOIN users u ON u.id = pm.user_id
                 WHERE pm.project_id = ?
                 ORDER BY u.first_name, u.last_name"
            );
            $membersStmt->execute([$id]);
            $project['members'] = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['project' => $project]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/projects
     */
    public function create() {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        $name = trim($data['name'] ?? '');
        if (empty($name)) {
            http_response_code(400);
            echo json_encode(['error' => 'Proje adı zorunludur']);
            return;
        }

        $priorityInput = $data['priority'] ?? 'medium';
        $priority = in_array($priorityInput, ['low', 'medium', 'high', 'critical'], true) ? $priorityInput : 'medium';

        try {
            $pdo = Database::getConnection();
            $pdo->beginTransaction();

            $stmt = $pdo->prepare(
                "INSERT INTO projects (name, description, start_date, end_date, priority, created_by)
                 VALUES (?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $name,
                $data['description'] ?? null,
                empty($data['start_date']) ? null : $data['start_date'],
                empty($data['end_date']) ? null : $data['end_date'],
                $priority,
                $user['user_id']
            ]);
            $newId = $pdo->lastInsertId();

            // Creator is automatically a member
            $pdo->prepare("INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)")
                ->execute([$newId, $user['user_id']]);

            // Optional initial member list
            if (!empty($data['member_ids']) && is_array($data['member_ids'])) {
                $memberStmt = $pdo->prepare("INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)");
                foreach ($data['member_ids'] as $memberId) {
                    $memberStmt->execute([$newId, (int) $memberId]);
                }
            }

            $pdo->commit();

            ActivityLogController::log($user['user_id'], $user['username'], 'project.create', "Created project \"{$name}\"", 'project', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/projects/{id}
     */
    public function update($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();

            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Bu projeyi düzenleme yetkiniz yok']);
                return;
            }

            $fields = [];
            $params = [];

            if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = trim($data['name']); }
            if (isset($data['description'])) { $fields[] = 'description = ?'; $params[] = $data['description']; }
            if (isset($data['start_date'])) { $fields[] = 'start_date = ?'; $params[] = empty($data['start_date']) ? null : $data['start_date']; }
            if (isset($data['end_date'])) { $fields[] = 'end_date = ?'; $params[] = empty($data['end_date']) ? null : $data['end_date']; }
            if (isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high', 'critical'], true)) {
                $fields[] = 'priority = ?'; $params[] = $data['priority'];
            }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE projects SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);

            ActivityLogController::log($user['user_id'], $user['username'], 'project.update', "Updated project ID {$id}", 'project', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/projects/{id}
     * Creator or Admin only.
     */
    public function delete($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            $stmt = $pdo->prepare("SELECT created_by FROM projects WHERE id = ?");
            $stmt->execute([$id]);
            $project = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$project) {
                http_response_code(404);
                echo json_encode(['error' => 'Proje bulunamadı']);
                return;
            }

            if (!$this->auth->isAdmin($user) && $project['created_by'] != $user['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece proje sahibi silebilir']);
                return;
            }

            $pdo->prepare("DELETE FROM projects WHERE id = ?")->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'project.delete', "Deleted project ID {$id}", 'project', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/projects/{id}/members  { user_id }
     */
    public function addMember($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);
        $memberId = (int) ($data['user_id'] ?? 0);

        if (!$memberId) {
            http_response_code(400);
            echo json_encode(['error' => 'user_id gerekli']);
            return;
        }

        try {
            $pdo = Database::getConnection();

            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $pdo->prepare("INSERT IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)")
                ->execute([$id, $memberId]);

            ActivityLogController::log($user['user_id'], $user['username'], 'project.add_member', "Added member {$memberId} to project ID {$id}", 'project', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/projects/{id}/members/{userId}
     */
    public function removeMember($id, $userId) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $pdo->prepare("DELETE FROM project_members WHERE project_id = ? AND user_id = ?")
                ->execute([$id, $userId]);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
