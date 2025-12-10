<?php
session_start();
header("Content-Type: application/json");

require_once '../config/db.php';

$username   = $_POST['username'] ?? '';
$email      = $_POST['email'] ?? '';
$password   = $_POST['password'] ?? '';
$confirm    = $_POST['confirmPassword'] ?? '';

// Validation
if (empty($username) || empty($email) || empty($password) || empty($confirm)) {
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit;
}

if ($password !== $confirm) {
    echo json_encode(["status" => "error", "message" => "Passwords do not match"]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters"]);
    exit;
}

// Check for existing user
$check = $conn->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
$check->bind_param("ss", $username, $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Username or Email already exists!"]);
    exit;
}

$check->close();

// Hash password
$hashed = password_hash($password, PASSWORD_DEFAULT);

// Insert
$stmt = $conn->prepare("INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')");
$stmt->bind_param("sss", $username, $email, $hashed);

if ($stmt->execute()) {

    echo json_encode([
        "status" => "success",
        "message" => "Registration successful! Please login."
    ]);

} else {
    echo json_encode(["status" => "error", "message" => "Registration failed!"]);
}

$stmt->close();
$conn->close();
?>
