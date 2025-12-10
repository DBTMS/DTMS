<?php
require_once __DIR__ . '/../models/Node.php';
require_once __DIR__ . '/../models/Traffic.php';

class NodeController {
    private $node;
    private $traffic;

    public function __construct() {
        $this->node = new Node();
        $this->traffic = new Traffic();
    }

    public function createNode($data) {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::isAuthenticated();

        $this->node->node_name = $data['node_name'];
        $this->node->node_ip = $data['node_ip'];
        $this->node->node_location = $data['node_location'];
        $this->node->created_by = $_SESSION['user_id'];

        // Validate IP address
        if(!filter_var($this->node->node_ip, FILTER_VALIDATE_IP)) {
            return ['success' => false, 'message' => 'Invalid IP address'];
        }

        // Check if user can create more nodes
        $userNodes = $this->node->getNodesByUser($_SESSION['user_id']);
        if($userNodes->rowCount() >= 5 && $_SESSION['user_role'] !== 'admin') {
            return ['success' => false, 'message' => 'Maximum node limit reached'];
        }

        $api_key = $this->node->create();
        
        if($api_key) {
            return [
                'success' => true,
                'message' => 'Node created successfully',
                'api_key' => $api_key,
                'node' => [
                    'node_name' => $this->node->node_name,
                    'node_ip' => $this->node->node_ip,
                    'node_location' => $this->node->node_location
                ]
            ];
        } else {
            return ['success' => false, 'message' => 'Failed to create node'];
        }
    }

    public function getUserNodes() {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::isAuthenticated();

        $stmt = $this->node->getNodesByUser($_SESSION['user_id']);
        $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'nodes' => $nodes,
            'count' => count($nodes)
        ];
    }

    public function getAllNodes() {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::isAdmin();

        $stmt = $this->node->getAllNodes();
        $nodes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'nodes' => $nodes,
            'count' => count($nodes)
        ];
    }

    public function deleteNode($node_id) {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::isAuthenticated();

        if($this->node->delete($node_id, $_SESSION['user_id'])) {
            return ['success' => true, 'message' => 'Node deleted successfully'];
        } else {
            return ['success' => false, 'message' => 'Failed to delete node'];
        }
    }

    public function getNodeTraffic($node_id) {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::isAuthenticated();

        $stmt = $this->traffic->getTrafficByNode($node_id);
        $traffic = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'traffic' => $traffic,
            'count' => count($traffic)
        ];
    }

    public function getNodeStats($node_id) {
        $summary = $this->traffic->getTrafficSummary($node_id);
        $bandwidth = $this->traffic->getBandwidthUsage($node_id);
        $anomaly = $this->traffic->checkAnomaly($node_id);

        return [
            'success' => true,
            'summary' => $summary->fetchAll(PDO::FETCH_ASSOC),
            'bandwidth' => $bandwidth->fetchAll(PDO::FETCH_ASSOC),
            'has_anomaly' => $anomaly
        ];
    }

    public function verifyApiKey($api_key) {
        if($this->node->getNodeByApiKey($api_key)) {
            return ['success' => true, 'node_id' => $this->node->id];
        }
        return ['success' => false, 'message' => 'Invalid API key'];
    }
}
?>