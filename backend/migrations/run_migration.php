<?php
/**
 * Migration Runner — execute via: php run_migration.php
 */
$config = require __DIR__ . '/../config/database.php';
$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['database']};charset=utf8mb4";

try {
    $pdo = new PDO($dsn, $config['username'], $config['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to database.\n\n";

    $statements = [
        // 1. Add profile columns to users
        "ALTER TABLE users
          ADD COLUMN first_name VARCHAR(100) NULL AFTER password,
          ADD COLUMN last_name VARCHAR(100) NULL AFTER first_name,
          ADD COLUMN date_of_birth DATE NULL AFTER last_name,
          ADD COLUMN national_id VARCHAR(20) NULL AFTER date_of_birth,
          ADD COLUMN gender ENUM('male','female','other') NULL AFTER national_id,
          ADD COLUMN phone1 VARCHAR(20) NULL AFTER gender,
          ADD COLUMN phone2 VARCHAR(20) NULL AFTER phone1,
          ADD COLUMN email1 VARCHAR(150) NULL AFTER phone2,
          ADD COLUMN email2 VARCHAR(150) NULL AFTER email1,
          ADD COLUMN email3 VARCHAR(150) NULL AFTER email2,
          ADD COLUMN email4 VARCHAR(150) NULL AFTER email3,
          ADD COLUMN address TEXT NULL AFTER email4,
          ADD COLUMN work_country VARCHAR(100) NULL AFTER address,
          ADD COLUMN work_city VARCHAR(100) NULL AFTER work_country,
          ADD COLUMN office VARCHAR(100) NULL AFTER work_city,
          ADD COLUMN company VARCHAR(150) NULL AFTER office,
          ADD COLUMN department VARCHAR(100) NULL AFTER company,
          ADD COLUMN hire_date DATE NULL AFTER department,
          ADD COLUMN position VARCHAR(100) NULL AFTER hire_date,
          ADD COLUMN description TEXT NULL AFTER position,
          ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 AFTER description,
          ADD COLUMN manager_id INT NULL AFTER is_active,
          ADD COLUMN created_by INT NULL AFTER manager_id,
          ADD COLUMN updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
          ADD COLUMN last_login DATETIME NULL AFTER updated_at,
          ADD COLUMN deleted_at DATETIME NULL AFTER last_login",

        // 2. Foreign keys
        "ALTER TABLE users ADD CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL",
        "ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL",

        // 3. Indexes
        "ALTER TABLE users ADD INDEX idx_users_deleted_at (deleted_at)",
        "ALTER TABLE users ADD INDEX idx_users_manager_id (manager_id)",
        "ALTER TABLE users ADD INDEX idx_users_is_active (is_active)",

        // 4. Permissions table
        "CREATE TABLE IF NOT EXISTS permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          `key` VARCHAR(50) NOT NULL UNIQUE,
          name VARCHAR(100) NOT NULL,
          description VARCHAR(255) NULL
        ) ENGINE=InnoDB",

        // 5. Role-Permission pivot
        "CREATE TABLE IF NOT EXISTS role_permissions (
          role_id INT NOT NULL,
          permission_id INT NOT NULL,
          PRIMARY KEY (role_id, permission_id),
          FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
          FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
        ) ENGINE=InnoDB",

        // 6. Seed permissions
        "INSERT INTO permissions (`key`, name, description) VALUES
          ('user_view',      'View Users',       'Can view user profiles'),
          ('user_create',    'Create Users',     'Can create new users'),
          ('user_update',    'Update Users',     'Can edit user profiles'),
          ('user_delete',    'Delete Users',     'Can soft-delete users'),
          ('dashboard_view', 'View Dashboard',   'Can see the dashboard'),
          ('settings_view',  'View Settings',    'Can see system settings')",

        // 7. Admin gets all permissions
        "INSERT INTO role_permissions (role_id, permission_id) SELECT 1, id FROM permissions",

        // 8. Add permission_key to menus
        "ALTER TABLE menus ADD COLUMN permission_key VARCHAR(50) NULL AFTER icon",

        // 9. Set permission keys on existing menus
        "UPDATE menus SET permission_key = 'dashboard_view' WHERE path = '/dashboard'",
        "UPDATE menus SET permission_key = 'user_view' WHERE path = '/users'",
        "UPDATE menus SET permission_key = 'settings_view' WHERE path = '/settings'",

        // 10. Employee gets dashboard_view
        "INSERT INTO role_permissions (role_id, permission_id) SELECT 2, id FROM permissions WHERE `key` = 'dashboard_view'",

        // 11. Employee gets Dashboard menu access
        "INSERT IGNORE INTO role_menus (role_id, menu_id) SELECT 2, id FROM menus WHERE path = '/dashboard'",
    ];

    $ok = 0;
    $skip = 0;
    foreach ($statements as $i => $sql) {
        try {
            $pdo->exec($sql);
            $ok++;
            echo "  [OK]   #" . ($i+1) . ": " . substr(trim($sql), 0, 70) . "...\n";
        } catch (PDOException $e) {
            $msg = $e->getMessage();
            if (strpos($msg, 'Duplicate') !== false || strpos($msg, 'already exists') !== false) {
                $skip++;
                echo "  [SKIP] #" . ($i+1) . ": Already done\n";
            } else {
                echo "  [ERR]  #" . ($i+1) . ": $msg\n";
            }
        }
    }

    echo "\nDone: $ok executed, $skip skipped.\n";

} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
    exit(1);
}
