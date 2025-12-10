<?php
session_start();

class AuthMiddleware {
    public static function isAuthenticated() {
        if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['message' => 'Unauthorized access']);
            exit();
        }
        return true;
    }

    public static function isAdmin() {
        self::isAuthenticated();
        if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
            http_response_code(403);
            echo json_encode(['message' => 'Admin access required']);
            exit();
        }
        return true;
    }

    public static function generateApiKey($length = 32) {
        return bin2hex(random_bytes($length));
    }
}
?>