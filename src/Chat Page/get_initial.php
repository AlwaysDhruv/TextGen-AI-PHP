<?php
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['name'])) {
    echo json_encode([
        'success' => false,
        'error' => 'User not logged in or session expired.'
    ]);
    exit();
}

$name = trim($_SESSION['name']);
$firstChar = strtoupper(mb_substr($name, 0, 1));

echo json_encode([
    'success' => true,
    'initial' => $firstChar
]);
?>