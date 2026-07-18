<?php
/**
 * The 'Yapılacaklar' (Todos) menu was seeded with permission_key = 'todo_view',
 * but no user/role was ever granted that permission (a gap left by the
 * user_permissions migration running before this menu existed), so the menu
 * never appeared in the sidebar for anyone — including Admins.
 *
 * TodoController itself has no permission check ("everyone should access
 * Todos"), so Todos is meant to be open to all authenticated users, same as
 * Notes and Links. Clearing permission_key makes the menu visible again and
 * matches that intent instead of relying on a permission grant.
 */

require_once __DIR__ . '/../Core/Database.php';

try {
    $pdo = Database::getConnection();
    $pdo->exec("UPDATE menus SET permission_key = NULL WHERE path = '/dashboard/todos'");
    echo "Todos menu is now visible to all authenticated users.\n";
} catch (Exception $e) {
    die("Migration Failed: " . $e->getMessage() . "\n");
}
