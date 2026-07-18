<?php

require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();

    $stmt = $pdo->query("SHOW COLUMNS FROM calendar_events LIKE 'event_time'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE calendar_events ADD COLUMN event_time TIME NULL AFTER event_date");
        echo "Successfully added 'event_time' column to 'calendar_events' table.\n";
    } else {
        echo "Column 'event_time' already exists.\n";
    }

    $stmt = $pdo->query("SHOW COLUMNS FROM calendar_events LIKE 'is_done'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE calendar_events ADD COLUMN is_done TINYINT(1) NOT NULL DEFAULT 0 AFTER color");
        echo "Successfully added 'is_done' column to 'calendar_events' table.\n";
    } else {
        echo "Column 'is_done' already exists.\n";
    }

} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
