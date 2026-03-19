<?php

require_once __DIR__ . '/../Core/AuthMiddleware.php';

class UserController {

    private $auth;

    private $profileFields = [
        'first_name', 'last_name', 'date_of_birth', 'national_id', 'gender',
        'phone1', 'phone2', 'email1', 'email2', 'email3', 'email4',
        'address', 'work_country', 'work_city', 'office', 'company',
        'department', 'hire_date', 'position', 'description'
    ];

    public function __construct() {
        $this->auth = new AuthMiddleware();
    }

    /**
     * GET /api/users
     * List users filtered by hierarchy.
     */
    public function index() {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_view');

        try {
            $pdo = Database::getConnection();

            $baseQuery = "SELECT u.id, u.username, u.first_name, u.last_name, u.is_active,
                          r.name as role_name, u.manager_id,
                          IFNULL(NULLIF(TRIM(CONCAT_WS(' ', m.first_name, m.last_name)), ''), m.username) as manager_name,
                          m.username as manager_username
                          FROM users u
                          JOIN roles r ON u.role_id = r.id
                          LEFT JOIN users m ON u.manager_id = m.id
                          WHERE u.deleted_at IS NULL";

            if ($this->auth->isAdmin($user)) {
                // Admin sees all users
                $stmt = $pdo->query($baseQuery . " ORDER BY u.id");
            } else {
                // Get subordinate IDs
                $subordinateIds = $this->auth->getSubordinateIds($user['user_id']);
                $subordinateIds[] = $user['user_id']; // Include self

                if (empty($subordinateIds)) {
                    echo json_encode(['users' => []]);
                    return;
                }

                $placeholders = implode(',', array_fill(0, count($subordinateIds), '?'));
                $stmt = $pdo->prepare($baseQuery . " AND u.id IN ($placeholders) ORDER BY u.id");
                $stmt->execute($subordinateIds);
            }

            $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['users' => $users]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * GET /api/users/{id}
     * Get user profile.
     */
    public function show($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_view');

        // Access check: own profile, subordinate, or admin
        if (!$this->canAccessUser($user, $id)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare(
                "SELECT u.*, r.name as role_name,
                 IFNULL(NULLIF(TRIM(CONCAT_WS(' ', m.first_name, m.last_name)), ''), m.username) as manager_name,
                 m.username as manager_username,
                 IFNULL(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''), c.username) as created_by_name,
                 c.username as created_by_username
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 LEFT JOIN users m ON u.manager_id = m.id
                 LEFT JOIN users c ON u.created_by = c.id
                 WHERE u.id = ? AND u.deleted_at IS NULL"
            );
            $stmt->execute([$id]);
            $profile = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$profile) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }

            // Remove password from response
            unset($profile['password']);

            echo json_encode(['user' => $profile]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * POST /api/users
     * Create a new user.
     */
    public function create() {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_create');

        $data = json_decode(file_get_contents('php://input'), true);

        // Validate required fields
        if (!isset($data['username']) || !isset($data['password']) || !isset($data['role_id'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Username, password, and role are required']);
            return;
        }

        // Validate username format
        $username = trim($data['username']);
        if (strlen($username) < 3 || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
            http_response_code(400);
            echo json_encode(['error' => 'Username must be at least 3 characters (letters, numbers, underscores)']);
            return;
        }

        // Validate password strength
        if (strlen($data['password']) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters']);
            return;
        }

        // Validate email format if provided
        foreach (['email1', 'email2', 'email3', 'email4'] as $emailField) {
            if (!empty($data[$emailField]) && !filter_var($data[$emailField], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => "Invalid email format for $emailField"]);
                return;
            }
        }

        try {
            $pdo = Database::getConnection();

            // Check duplicate username
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ? AND deleted_at IS NULL");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                http_response_code(400);
                echo json_encode(['error' => 'Username already exists']);
                return;
            }

            // Build insert
            $fields = ['username', 'password', 'role_id', 'is_active', 'manager_id', 'created_by'];
            $values = [
                $username,
                password_hash($data['password'], PASSWORD_BCRYPT),
                (int)$data['role_id'],
                isset($data['is_active']) ? (int)$data['is_active'] : 1,
                !empty($data['manager_id']) ? (int)$data['manager_id'] : null,
                $user['user_id']
            ];

            // Add profile fields
            foreach ($this->profileFields as $field) {
                if (isset($data[$field]) && $data[$field] !== '') {
                    $fields[] = $field;
                    $values[] = trim($data[$field]);
                }
            }

            $placeholders = implode(',', array_fill(0, count($fields), '?'));
            $fieldNames = implode(',', $fields);

            $stmt = $pdo->prepare("INSERT INTO users ($fieldNames) VALUES ($placeholders)");
            $stmt->execute($values);

            $newId = $pdo->lastInsertId();
            echo json_encode(['success' => true, 'user_id' => $newId, 'message' => 'User created successfully']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/users/{id}
     * Update user profile.
     */
    public function update($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_update');

        if (!$this->canAccessUser($user, $id)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);

        // Validate emails if provided
        foreach (['email1', 'email2', 'email3', 'email4'] as $emailField) {
            if (!empty($data[$emailField]) && !filter_var($data[$emailField], FILTER_VALIDATE_EMAIL)) {
                http_response_code(400);
                echo json_encode(['error' => "Invalid email format for $emailField"]);
                return;
            }
        }

        try {
            $pdo = Database::getConnection();

            $setClauses = [];
            $params = [];

            // Update role (admin only)
            if (isset($data['role_id']) && $this->auth->isAdmin($user)) {
                $setClauses[] = 'role_id = ?';
                $params[] = (int)$data['role_id'];
            }

            // Update manager
            if (array_key_exists('manager_id', $data) && $this->auth->isAdmin($user)) {
                $setClauses[] = 'manager_id = ?';
                $params[] = !empty($data['manager_id']) ? (int)$data['manager_id'] : null;
            }

            // Update is_active
            if (isset($data['is_active'])) {
                $setClauses[] = 'is_active = ?';
                $params[] = (int)$data['is_active'];
            }

            // Update profile fields
            foreach ($this->profileFields as $field) {
                if (array_key_exists($field, $data)) {
                    $setClauses[] = "$field = ?";
                    $params[] = $data[$field] !== '' ? trim($data[$field]) : null;
                }
            }

            if (empty($setClauses)) {
                http_response_code(400);
                echo json_encode(['error' => 'No fields to update']);
                return;
            }

            $params[] = $id;
            $sql = "UPDATE users SET " . implode(', ', $setClauses) . " WHERE id = ? AND deleted_at IS NULL";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            echo json_encode(['success' => true, 'message' => 'User updated successfully']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
        }
    }

    /**
     * PUT /api/users/{id}/status
     * Toggle active/passive status.
     */
    public function toggleStatus($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_update');

        if (!$this->canAccessUser($user, $id)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        // Cannot deactivate yourself
        if ($user['user_id'] == $id) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot change your own status']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("UPDATE users SET is_active = NOT is_active WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$id]);

            $stmt = $pdo->prepare("SELECT is_active FROM users WHERE id = ?");
            $stmt->execute([$id]);
            $newStatus = $stmt->fetchColumn();

            echo json_encode([
                'success' => true,
                'is_active' => (bool)$newStatus,
                'message' => $newStatus ? 'User activated' : 'User deactivated'
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * PUT /api/users/{id}/reset-password
     * Reset a user's password.
     */
    public function resetPassword($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_update');

        if (!$this->canAccessUser($user, $id)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        if (!isset($data['password']) || strlen($data['password']) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Password must be at least 6 characters']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $passwordHash = password_hash($data['password'], PASSWORD_BCRYPT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$passwordHash, $id]);

            echo json_encode(['success' => true, 'message' => 'Password reset successfully']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * DELETE /api/users/{id}
     * Soft delete a user.
     */
    public function delete($id) {
        $user = $this->auth->verifyToken();
        $this->auth->requirePermission($user['user_id'], 'user_delete');

        // Cannot delete yourself
        if ($user['user_id'] == $id) {
            http_response_code(400);
            echo json_encode(['error' => 'Cannot delete yourself']);
            return;
        }

        if (!$this->canAccessUser($user, $id)) {
            http_response_code(403);
            echo json_encode(['error' => 'Forbidden']);
            return;
        }

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->prepare("UPDATE users SET deleted_at = NOW(), is_active = 0 WHERE id = ? AND deleted_at IS NULL");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['error' => 'User not found']);
                return;
            }

            echo json_encode(['success' => true, 'message' => 'User deleted successfully']);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * GET /api/users/managers
     * List potential managers for dropdown.
     */
    public function managers() {
        $user = $this->auth->verifyToken();

        try {
            $pdo = Database::getConnection();
            $stmt = $pdo->query(
                "SELECT u.id, u.username, u.first_name, u.last_name, r.name as role_name
                 FROM users u
                 JOIN roles r ON u.role_id = r.id
                 WHERE u.deleted_at IS NULL AND u.is_active = 1
                 ORDER BY u.first_name, u.last_name"
            );
            $managers = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode(['managers' => $managers]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Server error']);
        }
    }

    /**
     * Check if the authenticated user can access a target user's data.
     */
    private function canAccessUser($authUser, $targetUserId) {
        // Can always access own profile
        if ($authUser['user_id'] == $targetUserId) {
            return true;
        }

        // Admin can access everyone
        if ($this->auth->isAdmin($authUser)) {
            return true;
        }

        // Manager can access subordinates
        $subordinates = $this->auth->getSubordinateIds($authUser['user_id']);
        return in_array($targetUserId, $subordinates);
    }
}
