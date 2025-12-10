<?php
require_once __DIR__ . '/../config/db.php';

class Traffic {
    private $conn;
    private $table = "traffic_data";

    public $id;
    public $node_id;
    public $timestamp;
    public $source_ip;
    public $destination_ip;
    public $protocol;
    public $port;
    public $packet_size;
    public $traffic_type;
    public $bandwidth_usage;
    public $created_at;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " 
                 SET node_id = :node_id, timestamp = :timestamp, 
                     source_ip = :source_ip, destination_ip = :destination_ip,
                     protocol = :protocol, port = :port, 
                     packet_size = :packet_size, traffic_type = :traffic_type,
                     bandwidth_usage = :bandwidth_usage";
        
        $stmt = $this->conn->prepare($query);
        
        $stmt->bindParam(":node_id", $this->node_id);
        $stmt->bindParam(":timestamp", $this->timestamp);
        $stmt->bindParam(":source_ip", $this->source_ip);
        $stmt->bindParam(":destination_ip", $this->destination_ip);
        $stmt->bindParam(":protocol", $this->protocol);
        $stmt->bindParam(":port", $this->port);
        $stmt->bindParam(":packet_size", $this->packet_size);
        $stmt->bindParam(":traffic_type", $this->traffic_type);
        $stmt->bindParam(":bandwidth_usage", $this->bandwidth_usage);
        
        return $stmt->execute();
    }

    public function getTrafficByNode($node_id, $limit = 100) {
        $query = "SELECT * FROM " . $this->table . " 
                 WHERE node_id = :node_id 
                 ORDER BY timestamp DESC 
                 LIMIT :limit";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":node_id", $node_id, PDO::PARAM_INT);
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        return $stmt;
    }

    public function getRealTimeTraffic($user_id = null) {
        if($user_id) {
            $query = "SELECT t.*, n.node_name 
                     FROM " . $this->table . " t
                     JOIN nodes n ON t.node_id = n.id
                     WHERE n.created_by = :user_id
                     ORDER BY t.timestamp DESC 
                     LIMIT 50";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
        } else {
            $query = "SELECT t.*, n.node_name 
                     FROM " . $this->table . " t
                     JOIN nodes n ON t.node_id = n.id
                     ORDER BY t.timestamp DESC 
                     LIMIT 100";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function getTrafficSummary($node_id, $hours = 24) {
        $query = "SELECT 
                    traffic_type,
                    COUNT(*) as packet_count,
                    SUM(packet_size) as total_bytes,
                    AVG(packet_size) as avg_packet_size,
                    protocol,
                    DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour_group
                 FROM " . $this->table . " 
                 WHERE node_id = :node_id 
                   AND timestamp >= DATE_SUB(NOW(), INTERVAL :hours HOUR)
                 GROUP BY hour_group, traffic_type, protocol
                 ORDER BY hour_group DESC";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":node_id", $node_id);
        $stmt->bindParam(":hours", $hours);
        $stmt->execute();
        return $stmt;
    }

    public function getBandwidthUsage($node_id, $hours = 24) {
        $query = "SELECT 
                    DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as time_interval,
                    SUM(bandwidth_usage) as total_bandwidth
                 FROM " . $this->table . " 
                 WHERE node_id = :node_id 
                   AND timestamp >= DATE_SUB(NOW(), INTERVAL :hours HOUR)
                 GROUP BY time_interval
                 ORDER BY time_interval";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":node_id", $node_id);
        $stmt->bindParam(":hours", $hours);
        $stmt->execute();
        return $stmt;
    }

    public function checkAnomaly($node_id) {
        $query = "SELECT 
                    COUNT(*) as packet_count,
                    SUM(packet_size) as total_size
                 FROM " . $this->table . " 
                 WHERE node_id = :node_id 
                   AND timestamp >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":node_id", $node_id);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Check if traffic exceeds threshold (e.g., 1000 packets or 100MB in 5 minutes)
        if($row['packet_count'] > 1000 || $row['total_size'] > 100000000) {
            return true;
        }
        return false;
    }
}
?>