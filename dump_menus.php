<?php
require_once 'backend/Core/Database.php';
$data = Database::getConnection()->query('SELECT id, name, path, permission_key FROM menus')->fetchAll(PDO::FETCH_ASSOC);
file_put_contents('menus_output.json', json_encode($data, JSON_PRETTY_PRINT));
