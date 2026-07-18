<?php

require_once __DIR__ . '/../Core/Database.php';
require_once __DIR__ . '/../Core/AuthMiddleware.php';
require_once __DIR__ . '/ActivityLogController.php';

class CertificateController {

    private $auth;

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    /**
     * GET /api/certificates
     * All certificates/domains, soonest expiry first. Shared across the team
     * like Projects/Notes — this is infrastructure info everyone should see.
     */
    public function index() {
        $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query(
                "SELECT c.*, u.username as created_by_name,
                        DATEDIFF(c.expires_at, CURDATE()) as days_left
                 FROM certificates c
                 LEFT JOIN users u ON u.id = c.created_by
                 ORDER BY c.expires_at ASC"
            );
            echo json_encode(['certificates' => $stmt->fetchAll(PDO::FETCH_ASSOC)]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/certificates
     */
    public function create() {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        $title = trim($data['title'] ?? '');
        $expiresAt = trim($data['expires_at'] ?? '');
        if (empty($title) || empty($expiresAt)) {
            http_response_code(400);
            echo json_encode(['error' => 'Başlık ve son kullanma tarihi zorunludur']);
            return;
        }

        $typeInput = $data['type'] ?? 'other';
        $type = in_array($typeInput, ['domain', 'ssl', 'other'], true) ? $typeInput : 'other';
        $reminderDays = max(1, (int) ($data['reminder_days'] ?? 30));

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "INSERT INTO certificates (title, type, hostname, expires_at, provider, reminder_days, notes, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $stmt->execute([
                $title,
                $type,
                trim($data['hostname'] ?? '') ?: null,
                $expiresAt,
                trim($data['provider'] ?? '') ?: null,
                $reminderDays,
                $data['notes'] ?? null,
                $user['user_id']
            ]);
            $newId = $pdo->lastInsertId();

            ActivityLogController::log($user['user_id'], $user['username'], 'certificate.create', "Added certificate/domain \"{$title}\"", 'certificate', $newId);

            echo json_encode(['success' => true, 'id' => $newId]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/certificates/{id}
     */
    public function update($id) {
        $user = $this->auth->verifyToken();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $pdo = Database::getConnection();

            $fields = [];
            $params = [];

            if (isset($data['title'])) { $fields[] = 'title = ?'; $params[] = trim($data['title']); }
            if (isset($data['type']) && in_array($data['type'], ['domain', 'ssl', 'other'], true)) {
                $fields[] = 'type = ?'; $params[] = $data['type'];
            }
            if (isset($data['hostname'])) { $fields[] = 'hostname = ?'; $params[] = trim($data['hostname']) ?: null; }
            if (isset($data['expires_at']) && !empty($data['expires_at'])) { $fields[] = 'expires_at = ?'; $params[] = $data['expires_at']; }
            if (isset($data['provider'])) { $fields[] = 'provider = ?'; $params[] = trim($data['provider']) ?: null; }
            if (isset($data['reminder_days'])) { $fields[] = 'reminder_days = ?'; $params[] = max(1, (int) $data['reminder_days']); }
            if (isset($data['notes'])) { $fields[] = 'notes = ?'; $params[] = $data['notes']; }

            if (empty($fields)) {
                echo json_encode(['success' => true]);
                return;
            }

            $params[] = $id;
            $stmt = $pdo->prepare("UPDATE certificates SET " . implode(', ', $fields) . " WHERE id = ?");
            $stmt->execute($params);

            ActivityLogController::log($user['user_id'], $user['username'], 'certificate.update', "Updated certificate/domain ID {$id}", 'certificate', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/certificates/{id}
     */
    public function delete($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();

            $stmt = $pdo->prepare("SELECT created_by FROM certificates WHERE id = ?");
            $stmt->execute([$id]);
            $cert = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cert) {
                http_response_code(404);
                echo json_encode(['error' => 'Kayıt bulunamadı']);
                return;
            }
            if (!$this->auth->isAdmin($user) && $cert['created_by'] != $user['user_id']) {
                http_response_code(403);
                echo json_encode(['error' => 'Sadece ekleyen kişi veya yönetici silebilir']);
                return;
            }

            $pdo->prepare("DELETE FROM certificates WHERE id = ?")->execute([$id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'certificate.delete', "Deleted certificate/domain ID {$id}", 'certificate', $id);

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/certificates/{id}/check
     * Live SSL expiry lookup over a TLS socket (openssl_x509_parse) — only
     * meaningful for type === 'ssl' rows with a hostname. Domain (WHOIS)
     * expiry has no equivalent built into PHP, so those stay manual-entry.
     */
    public function check($id) {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("SELECT * FROM certificates WHERE id = ?");
            $stmt->execute([$id]);
            $cert = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$cert) {
                http_response_code(404);
                echo json_encode(['error' => 'Kayıt bulunamadı']);
                return;
            }
            if ($cert['type'] !== 'ssl' || empty($cert['hostname'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Canlı kontrol yalnızca SSL tipi ve hostname girilmiş kayıtlar için yapılabilir']);
                return;
            }

            $expiresAt = $this->fetchSslExpiry($cert['hostname']);
            if ($expiresAt === null) {
                http_response_code(502);
                echo json_encode(['error' => 'Sunucuya bağlanılamadı veya sertifika okunamadı']);
                return;
            }

            $upd = $pdo->prepare("UPDATE certificates SET expires_at = ? WHERE id = ?");
            $upd->execute([$expiresAt, $id]);

            ActivityLogController::log($user['user_id'], $user['username'], 'certificate.check', "Live SSL check for \"{$cert['title']}\"", 'certificate', $id);

            echo json_encode(['success' => true, 'expires_at' => $expiresAt]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    private function fetchSslExpiry($hostname) {
        $hostname = preg_replace('#^https?://#', '', trim($hostname));
        $hostname = explode('/', $hostname)[0];

        $context = stream_context_create(['ssl' => ['capture_peer_cert' => true, 'verify_peer' => false, 'verify_peer_name' => false]]);
        $client = @stream_socket_client(
            "ssl://{$hostname}:443",
            $errno,
            $errstr,
            5,
            STREAM_CLIENT_CONNECT,
            $context
        );
        if (!$client) return null;

        $params = stream_context_get_params($client);
        fclose($client);
        if (empty($params['options']['ssl']['peer_certificate'])) return null;

        $cert = openssl_x509_parse($params['options']['ssl']['peer_certificate']);
        if (!$cert || empty($cert['validTo_time_t'])) return null;

        return date('Y-m-d', $cert['validTo_time_t']);
    }
}
