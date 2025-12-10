<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../controllers/AdminController.php';
require_once __DIR__ . '/../middleware/auth.php';

$adminController = new AdminController();
$method = $_SERVER['REQUEST_METHOD'];
$data = json_decode(file_get_contents("php://input"), true);

// Check admin access for all endpoints
AuthMiddleware::isAdmin();

switch($method) {
    case 'GET':
        if(isset($_GET['stats'])) {
            $result = $adminController->getSystemStats();
        } elseif(isset($_GET['users'])) {
            $result = $adminController->getAllUsers();
        } elseif(isset($_GET['logs'])) {
            $result = $adminController->getSystemLogs($_GET['limit'] ?? 100);
        } else {
            http_response_code(400);
            $result = ['success' => false, 'message' => 'Invalid action'];
        }
        break;
        
    case 'POST':
    case 'PUT':
        if(isset($data['action'])) {
            switch($data['action']) {
                case 'update_user_role':
                    $result = $adminController->updateUserRole($data['user_id'], $data['role']);
                    break;
                case 'update_node_status':
                    $result = $adminController->updateNodeStatus($data['node_id'], $data['status']);
                    break;
                default:
                    http_response_code(400);
                    $result = ['success' => false, 'message' => 'Invalid action'];
            }
        } else {
            http_response_code(400);
            $result = ['success' => false, 'message' => 'Action required'];
        }
        break;
        
    case 'DELETE':
        if(isset($_GET['user_id'])) {
            $result = $adminController->deleteUser($_GET['user_id']);
        } else {
            http_response_code(400);
            $result = ['success' => false, 'message' => 'User ID required'];
        }
        break;
        
    default:
        http_response_code(405);
        $result = ['success' => false, 'message' => 'Method not allowed'];
}

echo json_encode($result);
?>