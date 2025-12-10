<?php
session_start();
header("Content-Type: application/json");

require_once '../config/db.php';

$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($username) || empty($password)) {
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit;
}

$stmt = $conn->prepare("SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?");
$stmt->bind_param("ss", $username, $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "Invalid username or email"]);
    exit;
}

$user = $result->fetch_assoc();

if (!password_verify($password, $user['password'])) {
    echo json_encode(["status" => "error", "message" => "Incorrect password"]);
    exit;
}

session_regenerate_id(true);

$_SESSION['user_id']   = $user['id'];
$_SESSION['username']  = $user['username'];
$_SESSION['user_role'] = $user['role'];
$_SESSION['logged_in'] = true;

// After successful login
echo json_encode([
    'status' => 'success',
    'message' => 'Login successful',
    'user' => [
        'id' => $user['id'],
        'username' => $user['username'],
        'role' => $user['role']
    ]
]);
?>
