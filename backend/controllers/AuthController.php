<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $user;

    public function __construct() {
        $this->user = new User();
    }

    public function register($data) {
        $this->user->username = $data['username'];
        $this->user->email = $data['email'];
        $this->user->password = $data['password'];

        // Validate input
        if(empty($this->user->username) || empty($this->user->email) || empty($this->user->password)) {
            return ['success' => false, 'message' => 'All fields are required'];
        }

        if(!filter_var($this->user->email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }

        if(strlen($this->user->password) < 6) {
            return ['success' => false, 'message' => 'Password must be at least 6 characters'];
        }

        // Check if user exists
        if($this->user->checkUsernameExists()) {
            return ['success' => false, 'message' => 'Username already taken'];
        }

        if($this->user->checkEmailExists()) {
            return ['success' => false, 'message' => 'Email already registered'];
        }

        // Create user
        if($this->user->register()) {
            return ['success' => true, 'message' => 'User registered successfully'];
        } else {
            return ['success' => false, 'message' => 'Registration failed'];
        }
    }

    public function login($data) {
        $this->user->username = $data['username'];
        $this->user->password = $data['password'];

        if(empty($this->user->username) || empty($this->user->password)) {
            return ['success' => false, 'message' => 'Username and password required'];
        }

        if($this->user->login()) {
            return [
                'success' => true,
                'message' => 'Login successful',
                'user' => [
                    'id' => $this->user->id,
                    'username' => $this->user->username,
                    'email' => $this->user->email,
                    'role' => $this->user->role
                ]
            ];
        } else {
            return ['success' => false, 'message' => 'Invalid credentials'];
        }
    }

    public function logout() {
        session_destroy();
        return ['success' => true, 'message' => 'Logged out successfully'];
    }

    public function getCurrentUser() {
        if(isset($_SESSION['user_id'])) {
            return [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username'],
                'role' => $_SESSION['user_role']
            ];
        }
        return null;
    }
}
?>