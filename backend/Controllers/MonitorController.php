<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class MonitorController {

    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    /**
     * GET /api/monitors
     * All monitors with a rolling 24h uptime % computed from monitor_logs.
     * There is no background scheduler in this stack (plain PHP, no worker
     * process) — the frontend polls check()/checkAll() while the page is
     * open, and a sysadmin who wants true unattended monitoring can point a
     * system cron at POST /api/monitors/check-all instead.
     */
    public function index() {
        $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query(
                "SELECT m.*, u.username as created_by_name,
                        (SELECT COUNT(*) FROM monitor_logs l WHERE l.monitor_id = m.id AND l.checked_at >= NOW() - INTERVAL 24 HOUR) as checks_24h,
                        (SELECT COUNT(*) FROM monitor_logs l WHERE l.monitor_id = m.id AND l.checked_at >= NOW() - INTERVAL 24 HOUR AND l.status = 'up') as ups_24h
                 FROM monitors m
                 LEFT JOIN users u ON u.id = m.created_by
                 ORDER BY m.location IS NULL, m.location, m.name"
            );
            $monitors = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($monitors as &$m) {
                $m['uptime_24h'] = $m['checks_24h'] > 0 ? round(($m['ups_24h'] / $m['checks_24h']) * 100, 1) : null;
                unset($m['checks_24h'], $m['ups_24h']);
            }
            echo json_encode(['monitors' => $monitors]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/monitors
     */
    public function create() {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        $name = trim($data['name'] ?? '');
        $target = trim($data['target'] ?? '');
        if (empty($name) || empty($target)) {
            http_response_code(400);
            echo json_encode(['error' => 'İsim ve hedef (IP/hostname) zorunludur']);
            return;
        }

        $deviceTypeInput = $data['device_type'] ?? 'other';
        $deviceType = in_array($deviceTypeInput, ['switch', 'access_point', 'modem', 'router', 'camera', 'server', 'other'], true) ? $deviceTypeInput : 'other';
        $checkTypeInput = $data['check_type'] ?? 'tcp';
        $checkType = in_array($checkTypeInput, ['tcp', 'http'], true) ? $checkTypeInput : 'tcp';
        $port = isset($data['port']) && $data['port'] !== '' ? (int) $data['port'] : null;

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "INSERT INTO monitors (name, location, device_type, check_type, target, port, username, password, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $name,
                trim($data['location'] ?? '') ?: null,
                $deviceType,
                $checkType,
                $target,
                $port,
                trim($data['username'] ?? '') ?: null,
                $data['password'] ?? null,
                $user['user_id']
            ]);
            $newId = $pdo->lastInsertId();

            ActivityLogController::log($user['user_id'], $user['username'], 'monitor.create', "Added monitor \"{$name}\"", 'monitor', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/monitors/{id}
     */
    public function update($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();

            $fields = [];
            $params = [];

            if (isset($data['name'])) { $fields[] = 'name = ?'; $params[] = trim($data['name']); }
            if (isset($data['location'])) { $fields[] = 'location = ?'; $params[] = trim($data['location']) ?: null; }
            if (isset($data['device_type']) && in_array($data['device_type'], ['switch', 'access_point', 'modem', 'router', 'camera', 'server', 'other'], true)) {
                $fields[] = 'device_type = ?'; $params[] = $data['device_type'];
            }
            if (isset($data['check_type']) && in_array($data['check_type'], ['tcp', 'http'], true)) {
                $fields[] = 'check_type = ?'; $params[] = $data['check_type'];
            }
            if (isset($data['target'])) { $fields[] = 'target = ?'; $params[] = trim($data['target']); }
            if (array_key_exists('port', $data)) { $fields[] = 'port = ?'; $params[] = $data['port'] !== '' && $data['port'] !== null ? (int) $data['port'] : null; }
            if (array_key_exists('username', $data)) { $fields[] = 'username = ?'; $params[] = trim($data['username'] ?? '') ?: null; }
            if (array_key_exists('password', $data)) { $fields[] = 'password = ?'; $params[] = $data['password'] ?: null; }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE monitors SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);

            ActivityLogController::log($user['user_id'], $user['username'], 'monitor.update', "Updated monitor ID {$id}", 'monitor', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/monitors/{id}
     */
    public function delete($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            $stmt = $pdo->prepare("SELECT created_by FROM monitors WHERE id = ?");
            $stmt->execute([$id]);
            $monitor = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$monitor) {
                http_response_code(404);
                echo json_encode(['error' => 'Kayıt bulunamadı']);
                return;
            }
            if (!$this->auth->isAdmin($user) && $monitor['created_by'] != $user['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece ekleyen kişi veya yönetici kaldırabilir']);
                return;
            }

            $pdo->prepare("DELETE FROM monitors WHERE id = ?")->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'monitor.delete', "Deleted monitor ID {$id}", 'monitor', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/monitors/{id}/check
     * Live reachability check — TCP connect or HTTP GET, whichever the
     * monitor is configured for. Deliberately avoids shell_exec('ping')
     * since that binary/permission isn't guaranteed on shared PHP hosting;
     * a TCP connect to the device's admin/web port is a portable proxy for
     * "is it alive" that needs no special privileges.
     */
    public function check($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT * FROM monitors WHERE id = ?");
            $stmt->execute([$id]);
            $monitor = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$monitor) {
                http_response_code(404);
                echo json_encode(['error' => 'Kayıt bulunamadı']);
                return;
            }

            $result = $this->runCheck($monitor);
            $this->recordResult($pdo, $monitor['id'], $result);

            echo json_encode(['success' => true, 'status' => $result['up'] ? 'up' : 'down', 'response_ms' => $result['ms']]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * POST /api/monitors/check-all
     * Checks every monitor. Called by the frontend's live-polling view, and
     * safe to also point a system crontab at (with a normal logged-in
     * user's token) for unattended background monitoring — see README.
     */
    public function checkAll() {
        $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $monitors = $pdo->query("SELECT * FROM monitors")->fetchAll(PDO::FETCH_ASSOC);

            $results = [];
            foreach ($monitors as $monitor) {
                $result = $this->runCheck($monitor);
                $this->recordResult($pdo, $monitor['id'], $result);
                $results[] = ['id' => $monitor['id'], 'status' => $result['up'] ? 'up' : 'down', 'response_ms' => $result['ms']];
            }

            echo json_encode(['success' => true, 'results' => $results]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    private function runCheck($monitor) {
        $start = microtime(true);
        $up = false;

        if ($monitor['check_type'] === 'http') {
            $target = trim($monitor['target']);
            if (!preg_match('#^https?://#i', $target)) {
                $target = 'http://' . $target . ($monitor['port'] ? ':' . $monitor['port'] : '');
            }
            $context = stream_context_create([
                'http' => ['timeout' => 2.5, 'method' => 'GET', 'ignore_errors' => true],
                'ssl'  => ['verify_peer' => false, 'verify_peer_name' => false],
            ]);
            $result = @file_get_contents($target, false, $context);
            // PHP 8.4 deprecated the magic $http_response_header variable in favor
            // of this function; support both since the project targets PHP 8.0+.
            $headers = function_exists('http_get_last_response_headers')
                ? http_get_last_response_headers()
                : ($http_response_header ?? []);
            if ($result !== false && !empty($headers[0])) {
                $up = (bool) preg_match('#HTTP/\S+\s+[23]\d\d#', $headers[0]);
            }
        } else {
            $port = $monitor['port'] ?: 80;
            $fp = @fsockopen($monitor['target'], $port, $errno, $errstr, 2);
            if ($fp) { $up = true; fclose($fp); }
        }

        $ms = (int) round((microtime(true) - $start) * 1000);
        return ['up' => $up, 'ms' => $ms];
    }

    private function recordResult(PDO $pdo, $monitorId, $result) {
        $status = $result['up'] ? 'up' : 'down';

        $pdo->prepare("UPDATE monitors SET last_status = ?, last_checked_at = NOW(), last_response_ms = ? WHERE id = ?")
            ->execute([$status, $result['up'] ? $result['ms'] : null, $monitorId]);

        $pdo->prepare("INSERT INTO monitor_logs (monitor_id, status, response_ms) VALUES (?, ?, ?)")
            ->execute([$monitorId, $status, $result['up'] ? $result['ms'] : null]);

        // Keep only the most recent 50 log rows per monitor.
        $pdo->prepare(
            "DELETE FROM monitor_logs WHERE monitor_id = ? AND id NOT IN (
                SELECT id FROM (SELECT id FROM monitor_logs WHERE monitor_id = ? ORDER BY checked_at DESC LIMIT 50) t
             )"
        )->execute([$monitorId, $monitorId]);
    }
}
