<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../controllers/NodeController.php';

$nodeController = new NodeController();

if($_SERVER['REQUEST_METHOD'] === 'GET') {
    if(isset($_GET['admin']) && $_GET['admin'] == 'true') {
        require_once __DIR__ . '/../middleware/auth.php';
        $result = $nodeController->getAllNodes();
    } else {
        $result = $nodeController->getUserNodes();
    }
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>