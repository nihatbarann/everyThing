<?php
require_once __DIR__ . '/backend/Core/Database.php';
$pdo = Database::getConnection();

function getCols($pdo, $table) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM `$table`");
        $cols = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo "TABLE: $table\n";
        foreach($cols as $col) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
    } catch (Exception $e) {
        echo "TABLE: $table NOT FOUND or error.\n";
    }
}

getCols($pdo, 'calendar_events');
getCols($pdo, 'todos');
getCols($pdo, 'notes');
getCols($pdo, 'links');
