<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../controllers/TrafficController.php';

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Get API key from header
    $api_key = $_SERVER['HTTP_X_API_KEY'] ?? null;
    
    if(!$api_key) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'API key required']);
        exit();
    }
    
    $data = json_decode(file_get_contents("php://input"), true);
    $trafficController = new TrafficController();
    $result = $trafficController->ingestTrafficData($data, $api_key);
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>