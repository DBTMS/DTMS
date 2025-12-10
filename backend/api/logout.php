<?php
session_start();
header("Content-Type: application/json");

// Destroy the session
session_destroy();

echo json_encode([
    "status" => "success",
    "message" => "Logged out successfully"
]);
?>