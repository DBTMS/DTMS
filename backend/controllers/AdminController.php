<?php
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Node.php';
require_once __DIR__ . '/../models/Traffic.php';

class AdminController {
    private $user;
    private $node;
    private $traffic;

    public function __construct() {
        $this->user = new User();
        $this->node = new Node();
        $this->traffic = new Traffic();
    }

    public function getSystemStats() {
        require_once __DIR__ . '/../config/db.php';
        $database = new Database();
        $conn = $database->getConnection();

        // Get total users
        $query = "SELECT COUNT(*) as total_users FROM users";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $users = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get total nodes
        $query = "SELECT COUNT(*) as total_nodes, 
                         SUM(CASE WHEN node_status = 'active' THEN 1 ELSE 0 END) as active_nodes
                  FROM nodes";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $nodes = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get total traffic data
        $query = "SELECT COUNT(*) as total_packets, 
                         SUM(packet_size) as total_data,
                         MAX(timestamp) as last_update
                  FROM traffic_data";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $traffic = $stmt->fetch(PDO::FETCH_ASSOC);

        // Get active alerts
        $query = "SELECT COUNT(*) as active_alerts 
                  FROM alerts 
                  WHERE status = 'active'";
        $stmt = $conn->prepare($query);
        $stmt->execute();
        $alerts = $stmt->fetch(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'stats' => [
                'users' => $users['total_users'],
                'nodes' => [
                    'total' => $nodes['total_nodes'],
                    'active' => $nodes['active_nodes']
                ],
                'traffic' => [
                    'packets' => $traffic['total_packets'],
                    'data' => $traffic['total_data'],
                    'last_update' => $traffic['last_update']
                ],
                'alerts' => $alerts['active_alerts']
            ]
        ];
    }

    public function getAllUsers() {
        $stmt = $this->user->getUsers();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'users' => $users,
            'count' => count($users)
        ];
    }

    public function updateUserRole($user_id, $role) {
        require_once __DIR__ . '/../config/db.php';
        $database = new Database();
        $conn = $database->getConnection();

        $query = "UPDATE users SET role = :role WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":role", $role);
        $stmt->bindParam(":id", $user_id);

        if($stmt->execute()) {
            return ['success' => true, 'message' => 'User role updated'];
        } else {
            return ['success' => false, 'message' => 'Failed to update user role'];
        }
    }

    public function deleteUser($user_id) {
        require_once __DIR__ . '/../config/db.php';
        $database = new Database();
        $conn = $database->getConnection();

        // Prevent deleting admin user
        if($user_id == 1) {
            return ['success' => false, 'message' => 'Cannot delete primary admin'];
        }

        $query = "DELETE FROM users WHERE id = :id";
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":id", $user_id);

        if($stmt->execute()) {
            return ['success' => true, 'message' => 'User deleted'];
        } else {
            return ['success' => false, 'message' => 'Failed to delete user'];
        }
    }

    public function updateNodeStatus($node_id, $status) {
        require_once __DIR__ . '/../middleware/auth.php';
        AuthMiddleware::isAdmin();

        if($this->node->updateStatus($node_id, $status)) {
            return ['success' => true, 'message' => 'Node status updated'];
        } else {
            return ['success' => false, 'message' => 'Failed to update node status'];
        }
    }

    public function getSystemLogs($limit = 100) {
        require_once __DIR__ . '/../config/db.php';
        $database = new Database();
        $conn = $database->getConnection();

        $query = "SELECT 'traffic' as type, timestamp, 
                         CONCAT('Traffic from node: ', node_id) as message
                  FROM traffic_data
                  UNION
                  SELECT 'alert' as type, created_at as timestamp, 
                         CONCAT('Alert: ', alert_message) as message
                  FROM alerts
                  UNION
                  SELECT 'user' as type, created_at as timestamp, 
                         CONCAT('User registered: ', username) as message
                  FROM users
                  ORDER BY timestamp DESC
                  LIMIT :limit";

        $stmt = $conn->prepare($query);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();

        $logs = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'logs' => $logs,
            'count' => count($logs)
        ];
    }
}
?>