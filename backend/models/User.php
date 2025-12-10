<?php

class User
{
    private $conn;
    private $table = "users";

    public function __construct($db)
    {
        $this->conn = $db;
    }

    public function register($username, $email, $password)
    {
        // Check existing
        $check = $this->conn->prepare("SELECT * FROM users WHERE username=? OR email=?");
        $check->bind_param("ss", $username, $email);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            return ["status" => "error", "message" => "Username or Email already exists"];
        }

        $hashed = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $this->conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hashed);

        if ($stmt->execute()) {
            return ["status" => "success", "message" => "Registration successful!"];
        }

        return ["status" => "error", "message" => "Failed to register user"];
    }

    public function login($username, $password)
    {
        $stmt = $this->conn->prepare("SELECT * FROM users WHERE username=? OR email=? LIMIT 1");
        $stmt->bind_param("ss", $username, $username);
        $stmt->execute();

        $result = $stmt->get_result();
        if ($result->num_rows == 0) {
            return ["status" => "error", "message" => "User not found"];
        }

        $user = $result->fetch_assoc();

        if (!password_verify($password, $user["password"])) {
            return ["status" => "error", "message" => "Incorrect password"];
        }

        return ["status" => "success", "message" => "Login successful"];
    }
}
