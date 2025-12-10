<?php
require_once __DIR__ . '/../config/db.php';

class Node {
    private $conn;
    private $table = "nodes";

    public $id;
    public $node_name;
    public $node_ip;
    public $node_location;
    public $node_status;
    public $api_key;
    public $created_by;
    public $created_at;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    public function create() {
        require_once __DIR__ . '/../middleware/auth.php';
        $this->api_key = AuthMiddleware::generateApiKey();
        
        $query = "INSERT INTO " . $this->table . " 
                 SET node_name = :node_name, node_ip = :node_ip, 
                     node_location = :node_location, api_key = :api_key, 
                     created_by = :created_by, node_status = 'active'";
        
        $stmt = $this->conn->prepare($query);
        
        $this->node_name = htmlspecialchars(strip_tags($this->node_name));
        $this->node_ip = htmlspecialchars(strip_tags($this->node_ip));
        $this->node_location = htmlspecialchars(strip_tags($this->node_location));
        
        $stmt->bindParam(":node_name", $this->node_name);
        $stmt->bindParam(":node_ip", $this->node_ip);
        $stmt->bindParam(":node_location", $this->node_location);
        $stmt->bindParam(":api_key", $this->api_key);
        $stmt->bindParam(":created_by", $this->created_by);
        
        if($stmt->execute()) {
            return $this->api_key;
        }
        return false;
    }

    public function getNodesByUser($user_id) {
        $query = "SELECT * FROM " . $this->table . " WHERE created_by = :user_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();
        return $stmt;
    }

    public function getAllNodes() {
        $query = "SELECT n.*, u.username as created_by_name 
                 FROM " . $this->table . " n 
                 LEFT JOIN users u ON n.created_by = u.id 
                 ORDER BY n.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function getNodeByApiKey($api_key) {
        $query = "SELECT * FROM " . $this->table . " WHERE api_key = :api_key LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":api_key", $api_key);
        $stmt->execute();
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->node_name = $row['node_name'];
            $this->node_ip = $row['node_ip'];
            return true;
        }
        return false;
    }

    public function updateStatus($node_id, $status) {
        $query = "UPDATE " . $this->table . " SET node_status = :status WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":id", $node_id);
        return $stmt->execute();
    }

    public function delete($node_id, $user_id) {
        $query = "DELETE FROM " . $this->table . " WHERE id = :id AND created_by = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $node_id);
        $stmt->bindParam(":user_id", $user_id);
        return $stmt->execute();
    }
}
?>