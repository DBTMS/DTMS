class RealTimeMonitor {
    constructor() {
        this.baseUrl = 'backend/api';
        this.isLive = false;
        this.refreshInterval = 10000; // 10 seconds
        this.timer = null;
        this.trafficChart = null;
        this.protocolChart = null;
        this.init();
    }

    init() {
        this.initEventListeners();
        this.initCharts();
        this.loadInitialData();
        this.startLiveUpdates();
    }

    initEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // Toggle live updates
        const toggleBtn = document.getElementById('toggleRealtime');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleLiveUpdates());
        }

        // Refresh interval selector
        const intervalSelect = document.getElementById('refreshInterval');
        if (intervalSelect) {
            intervalSelect.addEventListener('change', (e) => {
                this.refreshInterval = parseInt(e.target.value) * 1000;
                if (this.isLive) {
                    this.restartLiveUpdates();
                }
            });
        }

        // Pause chart button
        const pauseBtn = document.getElementById('pauseChart');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.toggleChartPause());
        }

        // Traffic filter
        const trafficFilter = document.getElementById('trafficFilter');
        if (trafficFilter) {
            trafficFilter.addEventListener('change', () => this.filterTraffic());
        }

        // Node filter
        const nodeFilter = document.getElementById('nodeFilter');
        if (nodeFilter) {
            nodeFilter.addEventListener('change', () => this.filterTraffic());
        }
    }

    initCharts() {
        // Traffic flow chart
        const trafficCtx = document.getElementById('liveTrafficChart');
        if (trafficCtx) {
            this.trafficChart = new Chart(trafficCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [
                        {
                            label: 'Incoming',
                            data: [],
                            borderColor: '#3498db',
                            backgroundColor: 'rgba(52, 152, 219, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Outgoing',
                            data: [],
                            borderColor: '#2ecc71',
                            backgroundColor: 'rgba(46, 204, 113, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Internal',
                            data: [],
                            borderColor: '#f39c12',
                            backgroundColor: 'rgba(243, 156, 18, 0.1)',
                            tension: 0.4,
                            fill: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Packets per Second'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Time'
                            }
                        }
                    },
                    animation: {
                        duration: 0 // Disable animation for real-time updates
                    }
                }
            });
        }

        // Protocol distribution chart
        const protocolCtx = document.getElementById('liveProtocolChart');
        if (protocolCtx) {
            this.protocolChart = new Chart(protocolCtx.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'Other'],
                    datasets: [{
                        data: [0, 0, 0, 0, 0, 0],
                        backgroundColor: [
                            '#3498db',
                            '#2ecc71',
                            '#e74c3c',
                            '#f39c12',
                            '#9b59b6',
                            '#95a5a6'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        }
                    }
                }
            });
        }
    }

    async loadInitialData() {
        try {
            // Load nodes for filter
            await this.loadNodes();
            
            // Load initial stats and traffic
            await this.updateStats();
            await this.updateTrafficData();
            await this.updateTrafficTable();
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.showMessage('Failed to load initial data', 'error');
        }
    }

    async loadNodes() {
        try {
            const response = await fetch(`${this.baseUrl}/getNodes.php`);
            const data = await response.json();
            
            if (data.success && data.nodes) {
                this.populateNodeFilter(data.nodes);
                this.updateNodeStatusGrid(data.nodes);
            }
        } catch (error) {
            console.error('Error loading nodes:', error);
        }
    }

    populateNodeFilter(nodes) {
        const nodeFilter = document.getElementById('nodeFilter');
        if (!nodeFilter) return;
        
        // Clear existing options except "All Nodes"
        while (nodeFilter.options.length > 1) {
            nodeFilter.remove(1);
        }
        
        // Add node options
        nodes.forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `${node.node_name} (${node.node_ip})`;
            nodeFilter.appendChild(option);
        });
    }

    updateNodeStatusGrid(nodes) {
        const nodesGrid = document.getElementById('nodesLiveGrid');
        if (!nodesGrid) return;
        
        nodesGrid.innerHTML = nodes.map(node => `
            <div class="node-card">
                <div class="node-card-header">
                    <h4>
                        <i class="fas fa-server"></i>
                        ${node.node_name}
                    </h4>
                    <span class="status-badge status-${node.node_status}">
                        ${node.node_status}
                    </span>
                </div>
                <div class="node-info">
                    <div class="info-item">
                        <label>IP Address</label>
                        <span>${node.node_ip}</span>
                    </div>
                    <div class="info-item">
                        <label>Location</label>
                        <span>${node.node_location || 'Not specified'}</span>
                    </div>
                </div>
                <div class="node-stats">
                    <div class="stat-item-sm">
                        <div class="value">${node.packet_rate || 0}/s</div>
                        <div class="label">Rate</div>
                    </div>
                    <div class="stat-item-sm">
                        <div class="value">${this.formatBytes(node.bandwidth_rate || 0)}/s</div>
                        <div class="label">Bandwidth</div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    async updateStats() {
        try {
            const response = await fetch(`${this.baseUrl}/getTraffic.php?stats=realtime`);
            const data = await response.json();
            
            if (data.success) {
                this.updateStatsDisplay(data.stats);
            }
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    updateStatsDisplay(stats) {
        const livePackets = document.getElementById('livePackets');
        const liveBandwidth = document.getElementById('liveBandwidth');
        const liveNodes = document.getElementById('liveNodes');
        const liveAlerts = document.getElementById('liveAlerts');
        
        if (livePackets) livePackets.textContent = stats.packets_per_second || '0';
        if (liveBandwidth) liveBandwidth.textContent = `${stats.bandwidth_mbps || '0'} Mbps`;
        if (liveNodes) liveNodes.textContent = stats.active_nodes || '0';
        if (liveAlerts) liveAlerts.textContent = stats.active_alerts || '0';
    }

    async updateTrafficData() {
        try {
            const response = await fetch(`${this.baseUrl}/getTraffic.php?realtime=true`);
            const data = await response.json();
            
            if (data.success) {
                this.updateCharts(data.traffic);
            }
        } catch (error) {
            console.error('Error updating traffic data:', error);
        }
    }

    updateCharts(trafficData) {
        if (!trafficData || !Array.isArray(trafficData)) return;
        
        // Update traffic flow chart
        if (this.trafficChart) {
            const now = new Date();
            const labels = [];
            const incomingData = [];
            const outgoingData = [];
            const internalData = [];
            
            // Generate last 10 minutes of data
            for (let i = 9; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 60000);
                labels.push(time.getHours().toString().padStart(2, '0') + ':' + 
                            time.getMinutes().toString().padStart(2, '0'));
                
                // In a real implementation, you would aggregate actual data
                // For now, generate random data
                incomingData.push(Math.floor(Math.random() * 100) + 50);
                outgoingData.push(Math.floor(Math.random() * 80) + 30);
                internalData.push(Math.floor(Math.random() * 60) + 20);
            }
            
            this.trafficChart.data.labels = labels;
            this.trafficChart.data.datasets[0].data = incomingData;
            this.trafficChart.data.datasets[1].data = outgoingData;
            this.trafficChart.data.datasets[2].data = internalData;
            this.trafficChart.update('none');
        }
        
        // Update protocol chart
        if (this.protocolChart && trafficData.length > 0) {
            const protocolCounts = {
                'TCP': 0, 'UDP': 0, 'ICMP': 0, 
                'HTTP': 0, 'HTTPS': 0, 'Other': 0
            };
            
            trafficData.forEach(traffic => {
                const protocol = (traffic.protocol || 'Other').toUpperCase();
                if (protocolCounts.hasOwnProperty(protocol)) {
                    protocolCounts[protocol]++;
                } else {
                    protocolCounts['Other']++;
                }
            });
            
            this.protocolChart.data.datasets[0].data = [
                protocolCounts.TCP,
                protocolCounts.UDP,
                protocolCounts.ICMP,
                protocolCounts.HTTP,
                protocolCounts.HTTPS,
                protocolCounts.Other
            ];
            this.protocolChart.update('none');
        }
    }

    async updateTrafficTable() {
        try {
            const response = await fetch(`${this.baseUrl}/getTraffic.php?realtime=true&limit=20`);
            const data = await response.json();
            
            if (data.success) {
                this.populateTrafficTable(data.traffic);
            }
        } catch (error) {
            console.error('Error updating traffic table:', error);
        }
    }

    populateTrafficTable(trafficData) {
        const tableBody = document.getElementById('trafficTableBody');
        if (!tableBody) return;
        
        if (!trafficData || trafficData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">No traffic data available</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = trafficData.map(traffic => `
            <tr>
                <td>${this.formatTime(traffic.timestamp)}</td>
                <td>
                    <span class="ip-address" title="${traffic.source_ip}">
                        ${this.shortenIP(traffic.source_ip)}
                    </span>
                </td>
                <td>
                    <span class="ip-address" title="${traffic.destination_ip}">
                        ${this.shortenIP(traffic.destination_ip)}
                    </span>
                </td>
                <td>
                    <span class="protocol-badge protocol-${traffic.protocol?.toLowerCase()}">
                        ${traffic.protocol || 'Unknown'}
                    </span>
                </td>
                <td>${traffic.port || '-'}</td>
                <td>${this.formatBytes(traffic.packet_size || 0)}</td>
                <td>
                    <span class="traffic-type type-${traffic.traffic_type}">
                        ${traffic.traffic_type || 'unknown'}
                    </span>
                </td>
                <td>${traffic.node_name || 'Unknown'}</td>
            </tr>
        `).join('');
    }

    startLiveUpdates() {
        if (this.isLive) return;
        
        this.isLive = true;
        this.timer = setInterval(() => {
            this.updateAllData();
        }, this.refreshInterval);
        
        // Update button text
        const toggleBtn = document.getElementById('toggleRealtime');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Live';
            toggleBtn.classList.add('btn-warning');
            toggleBtn.classList.remove('btn-primary');
        }
    }

    stopLiveUpdates() {
        if (!this.isLive) return;
        
        this.isLive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
        
        // Update button text
        const toggleBtn = document.getElementById('toggleRealtime');
        if (toggleBtn) {
            toggleBtn.innerHTML = '<i class="fas fa-play"></i> Start Live';
            toggleBtn.classList.remove('btn-warning');
            toggleBtn.classList.add('btn-primary');
        }
    }

    toggleLiveUpdates() {
        if (this.isLive) {
            this.stopLiveUpdates();
        } else {
            this.startLiveUpdates();
        }
    }

    restartLiveUpdates() {
        this.stopLiveUpdates();
        this.startLiveUpdates();
    }

    toggleChartPause() {
        const pauseBtn = document.getElementById('pauseChart');
        if (!pauseBtn) return;
        
        const icon = pauseBtn.querySelector('i');
        if (icon.classList.contains('fa-pause')) {
            icon.classList.remove('fa-pause');
            icon.classList.add('fa-play');
            pauseBtn.title = 'Resume chart updates';
            
            // Store current chart state
            this.chartPaused = true;
        } else {
            icon.classList.remove('fa-play');
            icon.classList.add('fa-pause');
            pauseBtn.title = 'Pause chart updates';
            
            // Restore chart updates
            this.chartPaused = false;
            if (!this.isLive) {
                this.updateAllData();
            }
        }
    }

    async updateAllData() {
        if (this.updating) return;
        
        this.updating = true;
        try {
            await Promise.all([
                this.updateStats(),
                !this.chartPaused && this.updateTrafficData(),
                this.updateTrafficTable(),
                this.loadNodes() // Update node status
            ]);
        } catch (error) {
            console.error('Error updating real-time data:', error);
        } finally {
            this.updating = false;
        }
    }

    filterTraffic() {
        const trafficFilter = document.getElementById('trafficFilter').value;
        const nodeFilter = document.getElementById('nodeFilter').value;
        
        // In a real implementation, you would send filter parameters to the server
        // For now, we'll just show a message
        if (trafficFilter !== 'all' || nodeFilter !== 'all') {
            this.showMessage('Filters applied. In a real implementation, this would filter the data.', 'info');
        }
        
        // Refresh data with filters
        this.updateTrafficTable();
    }

    // Utility methods
    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    shortenIP(ip) {
        if (!ip) return '-';
        
        // For IPv4, just return as is
        if (ip.length <= 15) return ip;
        
        // For IPv6, shorten if too long
        if (ip.length > 20) {
            return ip.substring(0, 15) + '...';
        }
        
        return ip;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showMessage(message, type) {
        // Create message element if it doesn't exist
        let messageDiv = document.getElementById('realtimeMessage');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'realtimeMessage';
            messageDiv.className = 'message hidden';
            document.querySelector('.main-content').prepend(messageDiv);
        }
        
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.classList.remove('hidden');
        
        // Auto-hide after 3 seconds
        setTimeout(() => {
            messageDiv.classList.add('hidden');
        }, 3000);
    }
}

// Initialize real-time monitor when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.realtimeMonitor = new RealTimeMonitor();
});