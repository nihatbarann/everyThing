<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class TicketController {

    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    private function canAccess(PDO $pdo, $ticketId, $user) {
        if ($this->auth->isAdmin($user)) return true;
        $stmt = $pdo->prepare("SELECT id FROM tickets WHERE id = ? AND (created_by = ? OR assigned_to = ?)");
        $stmt->execute([$ticketId, $user['user_id'], $user['user_id']]);
        return (bool) $stmt->fetch();
    }

    private const SELECT_BASE = "
        SELECT t.*,
               IFNULL(NULLIF(TRIM(CONCAT_WS(' ', a.first_name, a.last_name)), ''), a.username) as assignee_name,
               IFNULL(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''), c.username) as creator_name
        FROM tickets t
        JOIN users a ON a.id = t.assigned_to
        JOIN users c ON c.id = t.created_by
    ";

    /**
     * GET /api/tickets?scope=assigned|created
     */
    public function index() {
        $user = $this->auth->verifyToken();
        $scope = ($_GET['scope'] ?? 'assigned') === 'created' ? 'created' : 'assigned';

        try {
            $pdo = Database::getConnection();
            $column = $scope === 'created' ? 'created_by' : 'assigned_to';

            $stmt = $pdo->prepare(
                self::SELECT_BASE . " WHERE t.$column = ? AND t.is_archived = 0 ORDER BY t.due_at ASC"
            );
            $stmt->execute([$user['user_id']]);
            echo json_encode(['tickets' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/tickets/archived
     */
    public function archived() {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                self::SELECT_BASE . " WHERE (t.created_by = ? OR t.assigned_to = ?) AND t.is_archived = 1 ORDER BY t.completed_at DESC"
            );
            $stmt->execute([$user['user_id'], $user['user_id']]);
            echo json_encode(['tickets' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/tickets/{id}
     */
    public function show($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $stmt = $pdo->prepare(self::SELECT_BASE . " WHERE t.id = ?");
            $stmt->execute([$id]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$ticket) {
                http_response_code(404);
                echo json_encode(['error' => 'Ticket bulunamadı']);
                return;
            }

            $commentsStmt = $pdo->prepare(
                "SELECT tc.*, IFNULL(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) as user_name
                 FROM ticket_comments tc
                 JOIN users u ON u.id = tc.user_id
                 WHERE tc.ticket_id = ?
                 ORDER BY tc.created_at ASC, tc.id ASC"
            );
            $commentsStmt->execute([$id]);
            $ticket['comments'] = $commentsStmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode(['ticket' => $ticket]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/tickets
     * Body: { title, description, priority, start_at, assigned_to: [userId, ...] }
     * Creates one ticket per assignee — "assign to a user or users".
     */
    public function create() {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        $title = trim($data['title'] ?? '');
        $assignees = isset($data['assigned_to']) && is_array($data['assigned_to']) ? array_filter(array_map('intval', $data['assigned_to'])) : [];

        if (empty($title) || empty($assignees) || empty($data['start_at'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Başlık, başlangıç tarihi ve en az bir atanan kişi zorunludur']);
            return;
        }

        $priority = in_array($data['priority'] ?? 'medium', ['low', 'medium', 'high'], true) ? $data['priority'] : 'medium';

        try {
            $pdo = Database::getConnection();
            $pdo->beginTransaction();

            // Due date is always exactly 24 hours after the start — daily-task rule enforced server-side.
            $stmt = $pdo->prepare(
                "INSERT INTO tickets (title, description, priority, start_at, due_at, created_by, assigned_to)
                 VALUES (?, ?, ?, ?, DATE_ADD(?, INTERVAL 24 HOUR), ?, ?)"
            );

            $ids = [];
            foreach (array_unique($assignees) as $assigneeId) {
                $stmt->execute([$title, $data['description'] ?? null, $priority, $data['start_at'], $data['start_at'], $user['user_id'], $assigneeId]);
                $newId = $pdo->lastInsertId();
                $ids[] = $newId;
                ActivityLogController::log($user['user_id'], $user['username'], 'ticket.create', "Created ticket \"{$title}\" for user {$assigneeId}", 'ticket', $newId);
            }

            $pdo->commit();
            echo json_encode(['success' => true, 'ids' => $ids]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/tickets/{id}
     * Creator (or Admin) can edit title/description/priority.
     */
    public function update($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();

            $stmt = $pdo->prepare("SELECT created_by FROM tickets WHERE id = ?");
            $stmt->execute([$id]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$ticket) { http_response_code(404); echo json_encode(['error' => 'Ticket bulunamadı']); return; }

            if (!$this->auth->isAdmin($user) && $ticket['created_by'] != $user['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece ticketı oluşturan kişi düzenleyebilir']);
                return;
            }

            $fields = [];
            $params = [];
            if (isset($data['title'])) { $fields[] = 'title = ?'; $params[] = trim($data['title']); }
            if (isset($data['description'])) { $fields[] = 'description = ?'; $params[] = $data['description']; }
            if (isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high'], true)) {
                $fields[] = 'priority = ?'; $params[] = $data['priority'];
            }

            if (empty($fields)) { echo json_encode(['success' => true]); return; }

            $params[] = $id;
            $pdo->prepare("UPDATE tickets SET " . implode(', ', $fields) . " WHERE id = ?")->execute($params);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/tickets/{id}
     */
    public function delete($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT created_by FROM tickets WHERE id = ?");
            $stmt->execute([$id]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$ticket) { http_response_code(404); echo json_encode(['error' => 'Ticket bulunamadı']); return; }

            if (!$this->auth->isAdmin($user) && $ticket['created_by'] != $user['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece ticketı oluşturan kişi silebilir']);
                return;
            }

            $pdo->prepare("DELETE FROM tickets WHERE id = ?")->execute([$id]);
            ActivityLogController::log($user['user_id'], $user['username'], 'ticket.delete', "Deleted ticket ID {$id}", 'ticket', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/tickets/{id}/complete
     * Assignee, creator, or Admin can mark it done — moves to archive.
     */
    public function complete($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);
        $note = trim($data['note'] ?? '');

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $pdo->prepare("UPDATE tickets SET status = 'completed', is_archived = 1, completed_at = NOW() WHERE id = ?")->execute([$id]);

            if ($note !== '') {
                $pdo->prepare("INSERT INTO ticket_comments (ticket_id, user_id, type, comment) VALUES (?, ?, 'completion', ?)")
                    ->execute([$id, $user['user_id'], $note]);
            }

            ActivityLogController::log($user['user_id'], $user['username'], 'ticket.complete', "Completed ticket ID {$id}", 'ticket', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/tickets/{id}/comments
     * Body: { comment }. Any participant (creator, assignee, Admin) can add a progress note
     * at any time — without completing the ticket.
     */
    public function addComment($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);
        $comment = trim($data['comment'] ?? '');

        if ($comment === '') {
            http_response_code(400);
            echo json_encode(['error' => 'Not boş olamaz']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $pdo->prepare("INSERT INTO ticket_comments (ticket_id, user_id, type, comment) VALUES (?, ?, 'comment', ?)")
                ->execute([$id, $user['user_id'], $comment]);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/tickets/{id}/reassign
     * Body: { assigned_to }. Current assignee, creator, or Admin can hand the ticket off
     * to someone else — it shouldn't get stuck with only the original assignee.
     */
    public function reassign($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);
        $newAssignee = (int) ($data['assigned_to'] ?? 0);

        if (!$newAssignee) {
            http_response_code(400);
            echo json_encode(['error' => 'assigned_to gerekli']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            if (!$this->canAccess($pdo, $id, $user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Yetkiniz yok']);
                return;
            }

            $stmt = $pdo->prepare(
                "SELECT assigned_to, IFNULL(NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), ''), u.username) as old_name
                 FROM tickets t JOIN users u ON u.id = t.assigned_to WHERE t.id = ?"
            );
            $stmt->execute([$id]);
            $current = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$current) { http_response_code(404); echo json_encode(['error' => 'Ticket bulunamadı']); return; }

            $newStmt = $pdo->prepare("SELECT IFNULL(NULLIF(TRIM(CONCAT_WS(' ', first_name, last_name)), ''), username) as name FROM users WHERE id = ?");
            $newStmt->execute([$newAssignee]);
            $newUser = $newStmt->fetch(PDO::FETCH_ASSOC);
            if (!$newUser) { http_response_code(404); echo json_encode(['error' => 'Kullanıcı bulunamadı']); return; }

            $pdo->prepare("UPDATE tickets SET assigned_to = ?, extension_status = 'none', requested_hours = NULL, extension_reason = NULL WHERE id = ?")
                ->execute([$newAssignee, $id]);

            $pdo->prepare("INSERT INTO ticket_comments (ticket_id, user_id, type, comment) VALUES (?, ?, 'reassignment', ?)")
                ->execute([$id, $user['user_id'], "Ticket {$current['old_name']} kişisinden {$newUser['name']} kişisine devredildi."]);

            ActivityLogController::log($user['user_id'], $user['username'], 'ticket.reassign', "Reassigned ticket ID {$id} to user {$newAssignee}", 'ticket', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/tickets/{id}/extension
     * Body: { hours, reason }. Assignee only, and only when no request is currently pending.
     */
    public function requestExtension($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);
        $hours = (int) ($data['hours'] ?? 0);

        if ($hours < 1) {
            http_response_code(400);
            echo json_encode(['error' => 'Geçerli bir saat girin']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT assigned_to, extension_status FROM tickets WHERE id = ?");
            $stmt->execute([$id]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$ticket) { http_response_code(404); echo json_encode(['error' => 'Ticket bulunamadı']); return; }
            if ($ticket['assigned_to'] != $user['user_id'] && !$this->auth->isAdmin($user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece atanan kişi ek süre talep edebilir']);
                return;
            }
            if ($ticket['extension_status'] === 'pending') {
                http_response_code(409);
                echo json_encode(['error' => 'Zaten bekleyen bir talebiniz var']);
                return;
            }

            $pdo->prepare("UPDATE tickets SET extension_status = 'pending', requested_hours = ?, extension_reason = ? WHERE id = ?")
                ->execute([$hours, $data['reason'] ?? null, $id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'ticket.request_extension', "Requested {$hours}h extension on ticket ID {$id}", 'ticket', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/tickets/{id}/extension/respond
     * Body: { decision: 'approve'|'reject' }. Creator (or Admin) only.
     */
    public function respondExtension($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);
        $decision = $data['decision'] ?? '';

        if (!in_array($decision, ['approve', 'reject'], true)) {
            http_response_code(400);
            echo json_encode(['error' => 'Geçersiz karar']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT created_by, requested_hours, extension_status FROM tickets WHERE id = ?");
            $stmt->execute([$id]);
            $ticket = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$ticket) { http_response_code(404); echo json_encode(['error' => 'Ticket bulunamadı']); return; }
            if ($ticket['created_by'] != $user['user_id'] && !$this->auth->isAdmin($user)) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece ticketı oluşturan kişi karar verebilir']);
                return;
            }
            if ($ticket['extension_status'] !== 'pending') {
                http_response_code(409);
                echo json_encode(['error' => 'Bekleyen bir talep yok']);
                return;
            }

            if ($decision === 'approve') {
                $pdo->prepare("UPDATE tickets SET extension_status = 'approved', due_at = DATE_ADD(due_at, INTERVAL ? HOUR) WHERE id = ?")
                    ->execute([$ticket['requested_hours'], $id]);
            } else {
                $pdo->prepare("UPDATE tickets SET extension_status = 'rejected' WHERE id = ?")->execute([$id]);
            }

            ActivityLogController::log($user['user_id'], $user['username'], 'ticket.respond_extension', "{$decision}d extension on ticket ID {$id}", 'ticket', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
