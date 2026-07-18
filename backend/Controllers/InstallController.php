<?php

class InstallController {
    public function testConnection() {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['db_host'], $data['db_port'], $data['db_user'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Gerekli veritabanı bilgileri eksik (host, port, user)']);
            return;
        }

        try {
            // Sadece bağlantıyı test et, DB seçimi yapma
            $password = isset($data['db_password']) ? $data['db_password'] : '';
            $dsn = "mysql:host={$data['db_host']};port={$data['db_port']}";
            $pdo = new PDO($dsn, $data['db_user'], $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            echo json_encode(['success' => true, 'message' => 'Veritabanı bağlantısı BAŞARILI!']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Bağlantı hatası: ' . $e->getMessage()]);
        }
    }
    public function check() {
        // Check if config/database.php exists
        $configFile = __DIR__ . '/../config/database.php';
        if (file_exists($configFile)) {
            echo json_encode(['installed' => true]);
        } else {
            echo json_encode(['installed' => false]);
        }
    }

    public function setup() {
        // Block if already installed (install.lock exists)
        $lockFile = __DIR__ . '/../config/install.lock';
        if (file_exists($lockFile)) {
            http_response_code(403);
            echo json_encode(['error' => 'System is already installed. Setup is disabled.']);
            return;
        }

        // Read JSON body
        $data = json_decode(file_get_contents('php://input'), true);

        if (!$data || !isset($data['db_host'], $data['db_port'], $data['db_name'], $data['db_user'], $data['db_password'], $data['admin_username'], $data['admin_password'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields']);
            return;
        }

        $adminUsername = trim($data['admin_username']);
        $adminPassword = (string) $data['admin_password'];

        if (strlen($adminUsername) < 3) {
            http_response_code(400);
            echo json_encode(['error' => 'Yönetici kullanıcı adı en az 3 karakter olmalıdır']);
            return;
        }
        if (strlen($adminPassword) < 6) {
            http_response_code(400);
            echo json_encode(['error' => 'Yönetici şifresi en az 6 karakter olmalıdır']);
            return;
        }

        try {
            // Test DB connection without a specific database to create the new one
            $dsn = "mysql:host={$data['db_host']};port={$data['db_port']}";
            $pdo = new PDO($dsn, $data['db_user'], $data['db_password']);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

            // Create database if not exists
            $dbName = preg_replace('/[^a-zA-Z0-9_]/', '', $data['db_name']); // Basic sanitization
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `$dbName` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            $pdo->exec("USE `$dbName`");

            // Create Tables (users, roles, menus, role_menu)
            $this->runMigrations($pdo);

            // Create the admin account the installer chose — no shared default credentials
            $this->createAdminUser($pdo, $adminUsername, $adminPassword);

            // Save Config File
            $this->saveConfig($data);

            // Create install.lock to prevent re-installation
            file_put_contents($lockFile, date('Y-m-d H:i:s'));

            echo json_encode(['success' => true, 'message' => 'System successfully installed!']);

        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        }
    }

    private function runMigrations(PDO $pdo) {
        $queries = [
            "CREATE TABLE IF NOT EXISTS roles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(50) NOT NULL UNIQUE
            ) ENGINE=InnoDB",

            "CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                role_id INT NOT NULL,
                username VARCHAR(50) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
            ) ENGINE=InnoDB",

            "CREATE TABLE IF NOT EXISTS menus (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                path VARCHAR(255) NOT NULL,
                icon VARCHAR(50)
            ) ENGINE=InnoDB",

            "CREATE TABLE IF NOT EXISTS role_menus (
                role_id INT NOT NULL,
                menu_id INT NOT NULL,
                PRIMARY KEY (role_id, menu_id),
                FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
                FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
            ) ENGINE=InnoDB"
        ];

        foreach ($queries as $query) {
            $pdo->exec($query);
        }

        // Insert default roles if table empty
        $stmt = $pdo->query("SELECT COUNT(*) FROM roles");
        if ($stmt->fetchColumn() == 0) {
            $pdo->exec("INSERT INTO roles (name) VALUES ('Admin'), ('Employee')");
        }
        
        // Insert default menus if empty
        $stmt = $pdo->query("SELECT COUNT(*) FROM menus");
        if($stmt->fetchColumn() == 0) {
            $pdo->exec("INSERT INTO menus (name, path, icon) VALUES
                ('Dashboard', '/dashboard', 'home'),
                ('Users', '/dashboard/users', 'users'),
                ('Settings', '/dashboard/settings', 'settings')
            ");
            
            // Give Admin access to all menus by default
            $pdo->exec("INSERT INTO role_menus (role_id, menu_id) SELECT 1, id FROM menus");
        }
    }

    private function createAdminUser(PDO $pdo, $username, $password) {
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $passwordHash = password_hash($password, PASSWORD_BCRYPT);

        if ($stmt->fetchColumn() == 0) {
            $stmt = $pdo->prepare("INSERT INTO users (role_id, username, password) VALUES (1, ?, ?)");
            $stmt->execute([$username, $passwordHash]);
        } else {
            // A retried/failed setup left this username behind — reset its password
            // to what was just submitted rather than leaving a stale credential.
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE username = ?");
            $stmt->execute([$passwordHash, $username]);
        }
    }

    private function saveConfig($data) {
        $configDir = __DIR__ . '/../config';
        if (!is_dir($configDir)) {
            mkdir($configDir, 0777, true);
        }
        $configFile = $configDir . '/database.php';
        
        $configContent = "<?php\n";
        $configContent .= "return [\n";
        $configContent .= "    'host' => '{$data['db_host']}',\n";
        $configContent .= "    'port' => '{$data['db_port']}',\n";
        $configContent .= "    'database' => '{$data['db_name']}',\n";
        $configContent .= "    'username' => '{$data['db_user']}',\n";
        $configContent .= "    'password' => '" . str_replace("'", "\\'", $data['db_password']) . "'\n";
        $configContent .= "];\n";

        file_put_contents($configFile, $configContent);
    }
}
