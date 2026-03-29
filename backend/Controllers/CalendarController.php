<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';

class CalendarController {

    private function requireAuth() {
        $auth = new AuthMiddleware();
        return $auth->verifyToken();
    }

    /**
     * GET /api/calendar?month=2026-03
     * List events for the logged-in user for a given month
     */
    public function index() {
        $user = $this->requireAuth();
        $month = $_GET['month'] ?? date('Y-m');
        
        // Validate month format
        if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid month format. Use YYYY-MM']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $startDate = $month . '-01';
            $endDate = date('Y-m-t', strtotime($startDate));
            
            $stmt = $pdo->prepare(
                "SELECT id, event_date, event_time, title, color, is_done 
                 FROM calendar_events 
                 WHERE user_id = ? AND event_date BETWEEN ? AND ?
                 ORDER BY event_date ASC, event_time ASC, id ASC"
            );
            $stmt->execute([$user['user_id'], $startDate, $endDate]);
            $events = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode(['events' => $events]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/calendar
     * Create a new calendar event
     */
    public function create() {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);
        
        $eventDate = trim($data['event_date'] ?? '');
        $eventTime = isset($data['event_time']) && trim($data['event_time']) !== '' ? trim($data['event_time']) : null;
        $title = trim($data['title'] ?? '');
        $color = trim($data['color'] ?? '#3b82f6');

        if (empty($eventDate) || empty($title)) {
            http_response_code(400);
            echo json_encode(['error' => 'event_date and title are required']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "INSERT INTO calendar_events (user_id, event_date, event_time, title, color) VALUES (?, ?, ?, ?, ?)"
            );
            $stmt->execute([$user['user_id'], $eventDate, $eventTime, substr($title, 0, 255), $color]);
            
            echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * DELETE /api/calendar/{id}
     * Delete a calendar event
     */
    public function delete($id) {
        $user = $this->requireAuth();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("DELETE FROM calendar_events WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $user['user_id']]);
            
            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/calendar/{id}
     * Update a calendar event
     */
    public function update($id) {
        $user = $this->requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();
            $check = $pdo->prepare("SELECT * FROM calendar_events WHERE id = ? AND user_id = ?");
            $check->execute([$id, $user['user_id']]);
            $event = $check->fetch();
            if (!$event) {
                http_response_code(404);
                echo json_encode(['error' => 'Event not found']);
                return;
            }

            $eventDate = isset($data['event_date']) ? trim($data['event_date']) : $event['event_date'];
            $eventTime = isset($data['event_time']) ? trim($data['event_time']) : $event['event_time'];
            if ($eventTime === '') $eventTime = null;
            $title = isset($data['title']) ? trim($data['title']) : $event['title'];
            $color = isset($data['color']) ? trim($data['color']) : $event['color'];
            $isDone = isset($data['is_done']) ? (int)$data['is_done'] : $event['is_done'];

            $stmt = $pdo->prepare("UPDATE calendar_events SET event_date = ?, event_time = ?, title = ?, color = ?, is_done = ? WHERE id = ?");
            $stmt->execute([$eventDate, $eventTime, $title, $color, $isDone, $id]);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }
}
