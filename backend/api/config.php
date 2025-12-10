<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

function isAuthenticated() {
    return isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true;
}

function getCurrentUserId() {
    return $_SESSION['user_id'] ?? null;
}

function isAdmin() {
    return ($_SESSION['user_role'] ?? '') === 'admin';
}
