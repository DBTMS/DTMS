<?php
// =============================================
// START SESSION
// =============================================
session_start([
    'cookie_lifetime' => 86400,   // 1 day
    'cookie_httponly' => true,
    'cookie_secure' => false,     // set true if using HTTPS
    'cookie_samesite' => 'Lax'
]);

require_once 'config.php'; // include mysqli $conn

// =============================================
// AUTH CHECK - FIXED HERE
// =============================================
if (!isset($_SESSION['user_id']) && !isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit();
}

// Get user ID from either session variable
$userId = $_SESSION['user_id'] ?? ($_SESSION['user']['id'] ?? null);

if (!$userId) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'User ID not found']);
    exit();
}

// =============================================
// DASHBOARD FUNCTION
// =============================================
function getDashboardStats($conn, $userId) {
    $data = [];

    // Total nodes
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM nodes WHERE user_id = ? AND status = 'active'");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['stats']['totalNodes'] = $result->fetch_assoc()['count'] ?? 0;
    $stmt->close();

    // Total traffic today
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(packets_sent + packets_received), 0) as total
        FROM traffic_data td
        JOIN nodes n ON td.node_id = n.id
        WHERE n.user_id = ? AND DATE(td.timestamp) = CURDATE()
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['stats']['totalTraffic'] = $result->fetch_assoc()['total'] ?? 0;
    $stmt->close();

    // Active alerts
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM alerts a
        JOIN nodes n ON a.node_id = n.id
        WHERE n.user_id = ? AND a.status = 'active'
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['stats']['activeAlerts'] = $result->fetch_assoc()['count'] ?? 0;
    $stmt->close();

    // Bandwidth MB
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(bytes), 0) as total_bytes
        FROM traffic_data td
        JOIN nodes n ON td.node_id = n.id
        WHERE n.user_id = ? AND DATE(td.timestamp) = CURDATE()
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $bytes = $result->fetch_assoc()['total_bytes'] ?? 0;
    $data['stats']['bandwidthUsage'] = round($bytes / 1024 / 1024, 2);
    $stmt->close();

    // Recent activity (last 10)
    $stmt = $conn->prepare("
        SELECT td.*, n.name AS node_name,
        CASE
            WHEN td.bytes > 1000000 THEN 'high'
            WHEN td.bytes > 100000 THEN 'medium'
            ELSE 'low'
        END AS activity_level
        FROM traffic_data td
        JOIN nodes n ON td.node_id = n.id
        WHERE n.user_id = ?
        ORDER BY td.timestamp DESC
        LIMIT 10
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['recentActivity'] = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Traffic chart data (last 24h)
    $stmt = $conn->prepare("
        SELECT DATE_FORMAT(timestamp, '%H:00') AS hour,
               COALESCE(SUM(packets_sent + packets_received), 0) AS packets,
               COALESCE(SUM(bytes), 0) AS bytes
        FROM traffic_data td
        JOIN nodes n ON td.node_id = n.id
        WHERE n.user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY HOUR(timestamp)
        ORDER BY HOUR(timestamp)
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['trafficData'] = $result->fetch_all(MYSQLI_ASSOC) ?: [];
    $stmt->close();

    // Protocol distribution (last 7 days)
    $stmt = $conn->prepare("
        SELECT COALESCE(protocol, 'other') AS protocol,
               COUNT(*) AS count,
               SUM(bytes) AS bytes
        FROM traffic_data td
        JOIN nodes n ON td.node_id = n.id
        WHERE n.user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY COALESCE(protocol, 'other')
    ");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['protocolData'] = $result->fetch_all(MYSQLI_ASSOC) ?: [];
    $stmt->close();

    // Nodes list
    $stmt = $conn->prepare("SELECT * FROM nodes WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $data['nodes'] = $result->fetch_all(MYSQLI_ASSOC) ?: [];
    $stmt->close();

    return $data;
}

// =============================================
// SEND RESPONSE
// =============================================
$dashboardData = getDashboardStats($conn, $userId);

echo json_encode([
    'success' => true,
    'data'    => $dashboardData,
    'user'    => [
        'id'       => $userId,
        'username' => $_SESSION['username'] ?? ($_SESSION['user']['username'] ?? 'User'),
        'role'     => $_SESSION['user_role'] ?? ($_SESSION['user']['role'] ?? 'user'),
        'isAdmin'  => ($_SESSION['user_role'] ?? ($_SESSION['user']['role'] ?? 'user')) === 'admin'
    ]
]);