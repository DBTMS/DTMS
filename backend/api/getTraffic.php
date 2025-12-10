<?php
session_start();
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

require_once __DIR__ . '/../controllers/TrafficController.php';

$trafficController = new TrafficController();

if($_SERVER['REQUEST_METHOD'] === 'GET') {
    if(isset($_GET['node_id'])) {
        $result = $trafficController->getTrafficSummary($_GET['node_id'], $_GET['hours'] ?? 24);
    } elseif(isset($_GET['realtime'])) {
        $user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
        $result = $trafficController->getRealTimeTraffic($user_id);
    } elseif(isset($_GET['alerts'])) {
        $node_id = $_GET['node_id'] ?? null;
        $result = $trafficController->getAlerts($node_id);
    } else {
        http_response_code(400);
        $result = ['success' => false, 'message' => 'Invalid parameters'];
    }
    
    echo json_encode($result);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>