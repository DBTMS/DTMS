<?php
require_once __DIR__ . '/../models/Traffic.php';
require_once __DIR__ . '/../models/Node.php';

class TrafficController {
    private $traffic;
    private $node;

    public function __construct() {
        $this->traffic = new Traffic();
        $this->node = new Node();
    }

    public function ingestTrafficData($data, $api_key) {
        // Verify API key
        if(!$this->node->getNodeByApiKey($api_key)) {
            return ['success' => false, 'message' => 'Invalid API key'];
        }

        $this->traffic->node_id = $this->node->id;
        $this->traffic->timestamp = date('Y-m-d H:i:s');
        $this->traffic->source_ip = $data['source_ip'] ?? null;
        $this->traffic->destination_ip = $data['destination_ip'] ?? null;
        $this->traffic->protocol = $data['protocol'] ?? 'TCP';
        $this->traffic->port = $data['port'] ?? 0;
        $this->traffic->packet_size = $data['packet_size'] ?? 0;
        $this->traffic->traffic_type = $data['traffic_type'] ?? 'incoming';
        $this->traffic->bandwidth_usage = $data['bandwidth_usage'] ?? 0;

        if($this->traffic->create()) {
            // Check for anomalies
            if($this->traffic->checkAnomaly($this->node->id)) {
                $this->createAlert(
                    $this->node->id,
                    'High traffic volume detected',
                    'Traffic exceeded normal thresholds',
                    'high'
                );
            }

            return ['success' => true, 'message' => 'Traffic data recorded'];
        } else {
            return ['success' => false, 'message' => 'Failed to record traffic data'];
        }
    }

    public function getRealTimeTraffic($user_id = null) {
        $stmt = $this->traffic->getRealTimeTraffic($user_id);
        $traffic = $stmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'success' => true,
            'traffic' => $traffic,
            'timestamp' => date('Y-m-d H:i:s'),
            'count' => count($traffic)
        ];
    }

    public function getTrafficSummary($node_id, $hours = 24) {
        $stmt = $this->traffic->getTrafficSummary($node_id, $hours);
        $summary = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stats = [
            'total_packets' => 0,
            'total_bytes' => 0,
            'by_protocol' => [],
            'by_type' => []
        ];

        foreach($summary as $row) {
            $stats['total_packets'] += $row['packet_count'];
            $stats['total_bytes'] += $row['total_bytes'];
            
            $protocol = $row['protocol'];
            $type = $row['traffic_type'];
            
            if(!isset($stats['by_protocol'][$protocol])) {
                $stats['by_protocol'][$protocol] = 0;
            }
            if(!isset($stats['by_type'][$type])) {
                $stats['by_type'][$type] = 0;
            }
            
            $stats['by_protocol'][$protocol] += $row['packet_count'];
            $stats['by_type'][$type] += $row['packet_count'];
        }

        return [
            'success' => true,
            'summary' => $summary,
            'stats' => $stats,
            'time_range' => $hours . ' hours'
        ];
    }

    private function createAlert($node_id, $type, $message, $severity) {
        require_once __DIR__ . '/../config/db.php';
        $database = new Database();
        $conn = $database->getConnection();

        $query = "INSERT INTO alerts 
                 SET node_id = :node_id, alert_type = :type, 
                     alert_message = :message, severity = :severity";
        
        $stmt = $conn->prepare($query);
        $stmt->bindParam(":node_id", $node_id);
        $stmt->bindParam(":type", $type);
        $stmt->bindParam(":message", $message);
        $stmt->bindParam(":severity", $severity);
        
        $stmt->execute();
    }

    public function getAlerts($node_id = null, $limit = 20) {
        require_once __DIR__ . '/../config/db.php';
        $database = new Database();
        $conn = $database->getConnection();

        if($node_id) {
            $query = "SELECT a.*, n.node_name 
                     FROM alerts a 
                     JOIN nodes n ON a.node_id = n.id
                     WHERE a.node_id = :node_id 
                     ORDER BY a.created_at DESC 
                     LIMIT :limit";
            $stmt = $conn->prepare($query);
            $stmt->bindParam(":node_id", $node_id);
        } else {
            $query = "SELECT a.*, n.node_name 
                     FROM alerts a 
                     JOIN nodes n ON a.node_id = n.id
                     ORDER BY a.created_at DESC 
                     LIMIT :limit";
            $stmt = $conn->prepare($query);
        }
        
        $stmt->bindParam(":limit", $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $alerts = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'success' => true,
            'alerts' => $alerts,
            'count' => count($alerts)
        ];
    }
}
?>