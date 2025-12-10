-- Create database
CREATE DATABASE IF NOT EXISTS dtms;
USE dtms;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Monitoring nodes table
CREATE TABLE nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_name VARCHAR(100) NOT NULL,
    node_ip VARCHAR(45) NOT NULL,
    node_location VARCHAR(255),
    node_status ENUM('active', 'inactive', 'error') DEFAULT 'inactive',
    api_key VARCHAR(255) UNIQUE NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Traffic data table
CREATE TABLE traffic_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    node_id INT NOT NULL,
    timestamp DATETIME NOT NULL,
    source_ip VARCHAR(45),
    destination_ip VARCHAR(45),
    protocol VARCHAR(10),
    port INT,
    packet_size INT,
    traffic_type ENUM('incoming', 'outgoing', 'internal') DEFAULT 'incoming',
    bandwidth_usage DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE,
    INDEX idx_timestamp (timestamp),
    INDEX idx_node_timestamp (node_id, timestamp)
);

-- Alerts table
CREATE TABLE alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    node_id INT,
    alert_type VARCHAR(50),
    alert_message TEXT,
    severity ENUM('low', 'medium', 'high', 'critical'),
    status ENUM('active', 'resolved') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
);

-- Settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, role) 
VALUES ('admin', 'admin@dtms.local', '$2y$10$YourHashedPasswordHere', 'admin');

-- Insert default settings
INSERT INTO settings (setting_key, setting_value) VALUES
('system_name', 'Distributed Traffic Monitoring System'),
('max_nodes_per_user', '5'),
('data_retention_days', '30'),
('alert_threshold', '1000');