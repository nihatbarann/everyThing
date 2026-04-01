<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class DataController {

    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    /**
     * GET /api/data/export
     * Export all personal data for the authenticated user as a JSON file.
     */
    public function export() {
        $user = $this->auth->verifyToken();
        $userId = $user['user_id'];

        try {
            $pdo = Database::getConnection();

            // --- Links ---
            $stmt = $pdo->prepare(
                "SELECT title, url, username, password, notes FROM links WHERE user_id = ? ORDER BY id ASC"
            );
            $stmt->execute([$userId]);
            $links = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // --- Notes ---
            $stmt = $pdo->prepare(
                "SELECT title, content FROM notes WHERE user_id = ? ORDER BY id ASC"
            );
            $stmt->execute([$userId]);
            $notes = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // --- Todos (only ones created by me) ---
            $stmt = $pdo->prepare(
                "SELECT title, description, status, priority, target_date, is_archived 
                 FROM todos WHERE creator_id = ? ORDER BY id ASC"
            );
            $stmt->execute([$userId]);
            $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // --- Calendar Events ---
            $stmt = $pdo->prepare(
                "SELECT event_date, event_time, title, color, is_done 
                 FROM calendar_events WHERE user_id = ? ORDER BY event_date ASC, id ASC"
            );
            $stmt->execute([$userId]);
            $calendar = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $payload = [
                'version'     => '1.0',
                'app'         => 'everyThing',
                'exported_at' => date('Y-m-d H:i:s'),
                'exported_by' => $user['username'],
                'data' => [
                    'links'    => $links,
                    'notes'    => $notes,
                    'todos'    => $todos,
                    'calendar' => $calendar,
                ]
            ];

            ActivityLogController::log(
                $userId, $user['username'],
                'data.export',
                "Exported personal data (" .
                    count($links) . " links, " .
                    count($notes) . " notes, " .
                    count($todos) . " todos, " .
                    count($calendar) . " calendar events)",
                'user', $userId
            );

            header('Content-Type: application/json; charset=utf-8');
            echo json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Export başarısız: ' . $e->getMessage()]);
        }
    }

    /**
     * POST /api/data/import
     * Import data from a previously exported JSON payload.
     * The user_id used is ALWAYS the authenticated user — not from the file.
     */
    public function import() {
        $user = $this->auth->verifyToken();
        $userId = $user['user_id'];

        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        // Validate JSON structure
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Geçersiz JSON formatı.']);
            return;
        }

        if (empty($payload['app']) || $payload['app'] !== 'everyThing') {
            http_response_code(400);
            echo json_encode(['error' => 'Bu dosya everyThing uygulamasına ait değil.']);
            return;
        }

        if (!isset($payload['data']) || !is_array($payload['data'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Dosya içeriği geçersiz veya bozuk.']);
            return;
        }

        $data = $payload['data'];

        $counts = [
            'links'    => 0,
            'notes'    => 0,
            'todos'    => 0,
            'calendar' => 0,
        ];

        try {
            $pdo = Database::getConnection();
            $pdo->beginTransaction();

            // --- Import Links ---
            if (!empty($data['links']) && is_array($data['links'])) {
                $stmt = $pdo->prepare(
                    "INSERT INTO links (user_id, title, url, username, password, notes) VALUES (?, ?, ?, ?, ?, ?)"
                );
                foreach ($data['links'] as $row) {
                    if (empty($row['title']) && empty($row['url'])) continue;
                    $stmt->execute([
                        $userId,
                        substr($row['title'] ?? '', 0, 255),
                        substr($row['url'] ?? '', 0, 2048),
                        $row['username'] ?? '',
                        $row['password'] ?? '',
                        $row['notes'] ?? '',
                    ]);
                    $counts['links']++;
                }
            }

            // --- Import Notes ---
            if (!empty($data['notes']) && is_array($data['notes'])) {
                $stmt = $pdo->prepare(
                    "INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)"
                );
                foreach ($data['notes'] as $row) {
                    if (empty($row['title'])) continue;
                    $stmt->execute([
                        $userId,
                        substr($row['title'] ?? '', 0, 255),
                        $row['content'] ?? '',
                    ]);
                    $counts['notes']++;
                }
            }

            // --- Import Todos ---
            if (!empty($data['todos']) && is_array($data['todos'])) {
                $stmt = $pdo->prepare(
                    "INSERT INTO todos (creator_id, assigned_to, title, description, status, priority, target_date, is_archived) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
                );
                $validStatuses  = ['todo', 'in_progress', 'done'];
                $validPriorities = ['low', 'medium', 'high'];
                foreach ($data['todos'] as $row) {
                    if (empty($row['title']) && empty($row['description'])) continue;
                    $status   = in_array($row['status'] ?? '', $validStatuses)   ? $row['status']   : 'todo';
                    $priority = in_array($row['priority'] ?? '', $validPriorities) ? $row['priority'] : 'medium';
                    $stmt->execute([
                        $userId,
                        $userId, // assign to self on import
                        substr($row['title'] ?? '', 0, 255),
                        $row['description'] ?? null,
                        $status,
                        $priority,
                        empty($row['target_date']) ? null : $row['target_date'],
                        isset($row['is_archived']) ? (int)$row['is_archived'] : 0,
                    ]);
                    $counts['todos']++;
                }
            }

            // --- Import Calendar ---
            if (!empty($data['calendar']) && is_array($data['calendar'])) {
                $stmt = $pdo->prepare(
                    "INSERT INTO calendar_events (user_id, event_date, event_time, title, color, is_done) VALUES (?, ?, ?, ?, ?, ?)"
                );
                foreach ($data['calendar'] as $row) {
                    if (empty($row['event_date']) || empty($row['title'])) continue;
                    // Validate date format
                    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $row['event_date'])) continue;
                    $stmt->execute([
                        $userId,
                        $row['event_date'],
                        !empty($row['event_time']) ? $row['event_time'] : null,
                        substr($row['title'] ?? '', 0, 255),
                        !empty($row['color']) ? $row['color'] : '#3b82f6',
                        isset($row['is_done']) ? (int)$row['is_done'] : 0,
                    ]);
                    $counts['calendar']++;
                }
            }

            $pdo->commit();

            ActivityLogController::log(
                $userId, $user['username'],
                'data.import',
                "Imported data: " .
                    $counts['links']    . " links, " .
                    $counts['notes']    . " notes, " .
                    $counts['todos']    . " todos, " .
                    $counts['calendar'] . " calendar events",
                'user', $userId
            );

            echo json_encode([
                'success' => true,
                'imported' => $counts,
                'message' => 'Veriler başarıyla içe aktarıldı.',
            ]);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            http_response_code(500);
            echo json_encode(['error' => 'İçe aktarma başarısız: ' . $e->getMessage()]);
        }
    }

    /**
     * GET /api/data/export/preview
     * Returns counts before committing import — called from frontend with the parsed JSON body.
     */
    public function previewImport() {
        $this->auth->verifyToken(); // just auth check

        $raw = file_get_contents('php://input');
        $payload = json_decode($raw, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['error' => 'Geçersiz JSON formatı.']);
            return;
        }

        if (empty($payload['app']) || $payload['app'] !== 'everyThing') {
            http_response_code(400);
            echo json_encode(['error' => 'Bu dosya everyThing uygulamasına ait değil.']);
            return;
        }

        $data = $payload['data'] ?? [];

        echo json_encode([
            'valid'       => true,
            'exported_by' => $payload['exported_by'] ?? '?',
            'exported_at' => $payload['exported_at'] ?? '?',
            'counts' => [
                'links'    => count($data['links']    ?? []),
                'notes'    => count($data['notes']    ?? []),
                'todos'    => count($data['todos']    ?? []),
                'calendar' => count($data['calendar'] ?? []),
            ]
        ]);
    }
}
