<?php
require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    echo "Kullanıcı yetkileri (User-Based Permissions) tablosu oluşturuluyor...\n";

    // Create the new table
    $sql = "CREATE TABLE IF NOT EXISTS user_permissions (
        user_id INT NOT NULL,
        permission_id INT NOT NULL,
        PRIMARY KEY (user_id, permission_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $pdo->exec($sql);

    // Fetch all current permissions
    $permsStmt = $pdo->query("SELECT id FROM permissions");
    $allPermIds = $permsStmt->fetchAll(PDO::FETCH_COLUMN);

    if (empty($allPermIds)) {
        echo "Uyarı: Permissions tablosunda hiç yetki bulunamadı. Lütfen öncelikle sistemi kurun.\n";
    }

    // Assign all permissions to existing Admin users (assuming role_id = 1 means Admin, or role name is Admin)
    $adminsStmt = $pdo->query("SELECT u.id FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'Admin' OR u.role_id = 1");
    $adminIds = $adminsStmt->fetchAll(PDO::FETCH_COLUMN);

    echo count($adminIds) . " Admin kullanıcısı tespit edildi. Yetkiler aktarılıyor...\n";

    $insertStmt = $pdo->prepare("INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES (?, ?)");

    foreach ($adminIds as $adminId) {
        foreach ($allPermIds as $permId) {
            $insertStmt->execute([$adminId, $permId]);
        }
    }

    echo "Tüm Admin kullanıcılara mevcut tüm izinler Başarıyla (Birebir) Atandı!\n";
    echo "Eski role_permissions ve role_menus tablolarını şimdilik GÜVENLİK gereği veritabanında bırakıyoruz ancak API kullanımı user_permissions üzerinden çalışacaktır.\n";

} catch (Exception $e) {
    die("Hata: " . $e->getMessage() . "\n");
}
