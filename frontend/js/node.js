class NodesManager {
    constructor() {
        this.baseUrl = 'backend/api';
        this.currentView = 'grid';
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadNodes();
        this.checkURLParams();
    }

    initEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // View toggle buttons
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                this.switchView(view);
            });
        });

        // Add node buttons
        const addButtons = document.querySelectorAll('#addNewNode, #addFirstNodeBtn');
        addButtons.forEach(btn => {
            if (btn) {
                btn.addEventListener('click', () => this.showAddNodeModal());
            }
        });

        // Modal close buttons
        const closeModals = document.querySelectorAll('.close-modal');
        closeModals.forEach(btn => {
            btn.addEventListener('click', () => {
                btn.closest('.modal').classList.remove('active');
            });
        });

        // Modal backdrop click
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Save node button
        const saveNodeBtn = document.getElementById('saveNodeBtn');
        if (saveNodeBtn) {
            saveNodeBtn.addEventListener('click', () => this.saveNode());
        }

        // Copy API key button
        const copyApiKeyBtn = document.getElementById('copyApiKeyBtn');
        if (copyApiKeyBtn) {
            copyApiKeyBtn.addEventListener('click', () => this.copyApiKey());
        }

        // Regenerate API key button
        const regenerateApiKeyBtn = document.getElementById('regenerateApiKeyBtn');
        if (regenerateApiKeyBtn) {
            regenerateApiKeyBtn.addEventListener('click', () => this.regenerateApiKey());
        }

        // Show API key button in details modal
        const showApiKeyBtn = document.getElementById('showApiKey');
        if (showApiKeyBtn) {
            showApiKeyBtn.addEventListener('click', () => this.revealApiKey());
        }
    }

    checkURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = urlParams.get('view');
        const editParam = urlParams.get('edit');
        
        if (viewParam) {
            this.viewNodeDetails(viewParam);
        } else if (editParam) {
            this.editNode(editParam);
        }
    }

    async loadNodes() {
        try {
            const response = await fetch(`${this.baseUrl}/getNodes.php`);
            const data = await response.json();
            
            if (data.success) {
                this.updateStats(data.nodes);
                this.displayNodes(data.nodes);
            }
        } catch (error) {
            console.error('Error loading nodes:', error);
            this.showMessage('Failed to load nodes', 'error');
        }
    }

    updateStats(nodes) {
        const totalNodes = document.getElementById('totalNodesCount');
        const activeNodes = document.getElementById('activeNodesCount');
        const inactiveNodes = document.getElementById('inactiveNodesCount');
        const nodeTraffic = document.getElementById('nodeTraffic');
        
        if (!nodes || nodes.length === 0) {
            if (totalNodes) totalNodes.textContent = '0';
            if (activeNodes) activeNodes.textContent = '0';
            if (inactiveNodes) inactiveNodes.textContent = '0';
            if (nodeTraffic) nodeTraffic.textContent = '0';
            return;
        }
        
        const activeCount = nodes.filter(node => node.node_status === 'active').length;
        const inactiveCount = nodes.filter(node => node.node_status === 'inactive').length;
        const errorCount = nodes.filter(node => node.node_status === 'error').length;
        
        if (totalNodes) totalNodes.textContent = nodes.length;
        if (activeNodes) activeNodes.textContent = activeCount;
        if (inactiveNodes) inactiveNodes.textContent = inactiveCount + errorCount;
        
        // Calculate total traffic (placeholder)
        const totalTraffic = nodes.reduce((sum, node) => sum + (node.packet_count || 0), 0);
        if (nodeTraffic) nodeTraffic.textContent = totalTraffic.toLocaleString();
    }

    displayNodes(nodes) {
        const noNodesMessage = document.getElementById('noNodesMessage');
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        const nodesListGrid = document.getElementById('nodesListGrid');
        const nodesTableBody = document.getElementById('nodesTableBody');
        
        if (!nodes || nodes.length === 0) {
            if (noNodesMessage) noNodesMessage.classList.remove('hidden');
            if (gridView) gridView.classList.add('hidden');
            if (listView) listView.classList.add('hidden');
            return;
        }
        
        if (noNodesMessage) noNodesMessage.classList.add('hidden');
        if (gridView) gridView.classList.remove('hidden');
        if (listView) listView.classList.remove('hidden');
        
        // Display grid view
        if (nodesListGrid) {
            nodesListGrid.innerHTML = nodes.map(node => this.createNodeCard(node)).join('');
        }
        
        // Display list view
        if (nodesTableBody) {
            nodesTableBody.innerHTML = nodes.map(node => this.createNodeRow(node)).join('');
        }
    }

    createNodeCard(node) {
        return `
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
                    <div class="info-item">
                        <label>Created</label>
                        <span>${this.formatDate(node.created_at)}</span>
                    </div>
                    <div class="info-item">
                        <label>Last Activity</label>
                        <span>${node.last_activity || 'Never'}</span>
                    </div>
                </div>
                <div class="node-stats">
                    <div class="stat-item-sm">
                        <div class="value">${node.packet_count || 0}</div>
                        <div class="label">Packets</div>
                    </div>
                    <div class="stat-item-sm">
                        <div class="value">${this.formatBytes(node.bandwidth_used || 0)}</div>
                        <div class="label">Bandwidth</div>
                    </div>
                    <div class="stat-item-sm">
                        <div class="value">${node.alerts || 0}</div>
                        <div class="label">Alerts</div>
                    </div>
                </div>
                <div class="node-actions">
                    <button class="btn btn-sm btn-primary" onclick="nodesManager.viewNodeDetails(${node.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="nodesManager.editNode(${node.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="nodesManager.deleteNode(${node.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    createNodeRow(node) {
        return `
            <tr>
                <td>
                    <strong>${node.node_name}</strong>
                </td>
                <td>${node.node_ip}</td>
                <td>${node.node_location || '-'}</td>
                <td>
                    <span class="status-badge status-${node.node_status}">
                        ${node.node_status}
                    </span>
                </td>
                <td>${node.last_activity || 'Never'}</td>
                <td>${node.packet_count || 0}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" onclick="nodesManager.viewNodeDetails(${node.id})" title="View">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="nodesManager.editNode(${node.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="nodesManager.deleteNode(${node.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    switchView(view) {
        if (this.currentView === view) return;
        
        this.currentView = view;
        
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });
        
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        
        if (view === 'grid') {
            gridView.classList.add('active');
            listView.classList.remove('active');
        } else {
            gridView.classList.remove('active');
            listView.classList.add('active');
        }
    }

    showAddNodeModal() {
        const modal = document.getElementById('nodeModal');
        if (modal) {
            document.getElementById('nodeModalTitle').textContent = 'Add New Node';
            document.getElementById('nodeForm').reset();
            document.getElementById('nodeId').value = '';
            document.getElementById('apiKeySection').classList.add('hidden');
            modal.classList.add('active');
        }
    }

    async viewNodeDetails(nodeId) {
        try {
            // In a real implementation, you would fetch node details
            // For now, we'll show a simplified modal
            const modal = document.getElementById('nodeDetailsModal');
            if (modal) {
                // Fetch node details
                const response = await fetch(`${this.baseUrl}/getNodes.php?id=${nodeId}`);
                const data = await response.json();
                
                if (data.success && data.nodes && data.nodes[0]) {
                    const node = data.nodes[0];
                    this.populateNodeDetails(node);
                    modal.classList.add('active');
                }
            }
        } catch (error) {
            console.error('Error viewing node details:', error);
            this.showMessage('Failed to load node details', 'error');
        }
    }

    populateNodeDetails(node) {
        document.getElementById('nodeDetailsTitle').textContent = node.node_name;
        document.getElementById('detailName').textContent = node.node_name;
        document.getElementById('detailIp').textContent = node.node_ip;
        document.getElementById('detailLocation').textContent = node.node_location || 'Not specified';
        document.getElementById('detailCreated').textContent = this.formatDate(node.created_at);
        document.getElementById('detailLastActivity').textContent = node.last_activity || 'Never';
        
        const statusBadge = document.getElementById('detailStatus');
        statusBadge.textContent = node.node_status;
        statusBadge.className = `status-badge status-${node.node_status}`;
        
        // Store node ID for actions
        document.getElementById('editNodeBtn').dataset.nodeId = node.id;
        document.getElementById('deleteNodeBtn').dataset.nodeId = node.id;
        document.getElementById('showApiKey').dataset.apiKey = node.api_key || '';
    }

    async editNode(nodeId) {
        try {
            const response = await fetch(`${this.baseUrl}/getNodes.php?id=${nodeId}`);
            const data = await response.json();
            
            if (data.success && data.nodes && data.nodes[0]) {
                const node = data.nodes[0];
                this.populateEditForm(node);
                
                const modal = document.getElementById('nodeModal');
                if (modal) {
                    document.getElementById('nodeModalTitle').textContent = 'Edit Node';
                    modal.classList.add('active');
                }
            }
        } catch (error) {
            console.error('Error loading node for edit:', error);
            this.showMessage('Failed to load node details', 'error');
        }
    }

    populateEditForm(node) {
        document.getElementById('nodeId').value = node.id;
        document.getElementById('nodeName').value = node.node_name;
        document.getElementById('nodeIp').value = node.node_ip;
        document.getElementById('nodeLocation').value = node.node_location || '';
        document.getElementById('nodeDescription').value = node.description || '';
        
        const apiKeySection = document.getElementById('apiKeySection');
        if (apiKeySection) {
            apiKeySection.classList.remove('hidden');
            document.getElementById('apiKeyValue').textContent = '••••••••••••••••••••••';
        }
    }

    async saveNode() {
        const nodeId = document.getElementById('nodeId').value;
        const nodeName = document.getElementById('nodeName').value;
        const nodeIp = document.getElementById('nodeIp').value;
        const nodeLocation = document.getElementById('nodeLocation').value;
        
        if (!nodeName || !nodeIp) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        if (!this.isValidIP(nodeIp)) {
            this.showMessage('Please enter a valid IP address', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('saveNodeBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        try {
            const url = nodeId ? `${this.baseUrl}/updateNode.php` : `${this.baseUrl}/addNode.php`;
            const method = nodeId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: nodeId || null,
                    node_name: nodeName,
                    node_ip: nodeIp,
                    node_location: nodeLocation
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage(nodeId ? 'Node updated successfully!' : 'Node added successfully!', 'success');
                
                // Close modal and refresh list
                document.getElementById('nodeModal').classList.remove('active');
                this.loadNodes();
                
                // If this was a new node, show the API key
                if (!nodeId && data.api_key) {
                    this.showApiKeyModal(data.api_key);
                }
            } else {
                this.showMessage(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving node:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    showApiKeyModal(apiKey) {
        // Create and show API key modal
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-key"></i> API Key Generated</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <p><strong>Important:</strong> Save this API key securely. You won't be able to see it again.</p>
                    </div>
                    <div class="api-key-display">
                        <code>${apiKey}</code>
                        <button class="btn btn-primary" id="copyNewApiKey">
                            <i class="fas fa-copy"></i> Copy to Clipboard
                        </button>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary close-modal">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#copyNewApiKey').addEventListener('click', () => {
            this.copyToClipboard(apiKey);
            this.showMessage('API key copied to clipboard!', 'success');
        });
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async deleteNode(nodeId) {
        if (!confirm('Are you sure you want to delete this node? All associated traffic data will also be deleted.')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/deleteNode.php?id=${nodeId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Node deleted successfully', 'success');
                this.loadNodes();
                
                // Close details modal if open
                const detailsModal = document.getElementById('nodeDetailsModal');
                if (detailsModal) {
                    detailsModal.classList.remove('active');
                }
            } else {
                this.showMessage(data.message || 'Failed to delete node', 'error');
            }
        } catch (error) {
            console.error('Error deleting node:', error);
            this.showMessage('An error occurred while deleting the node', 'error');
        }
    }

    copyApiKey() {
        const apiKeyValue = document.getElementById('apiKeyValue');
        if (!apiKeyValue) return;
        
        this.copyToClipboard(apiKeyValue.textContent);
        this.showMessage('API key copied to clipboard!', 'success');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .catch(err => {
                console.error('Failed to copy text:', err);
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            });
    }

    async regenerateApiKey() {
        if (!confirm('Are you sure you want to regenerate the API key? The old key will no longer work.')) {
            return;
        }
        
        const nodeId = document.getElementById('nodeId').value;
        if (!nodeId) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/regenerateApiKey.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ node_id: nodeId })
            });
            
            const data = await response.json();
            
            if (data.success) {
                document.getElementById('apiKeyValue').textContent = data.api_key;
                this.showMessage('API key regenerated successfully', 'success');
            } else {
                this.showMessage(data.message || 'Failed to regenerate API key', 'error');
            }
        } catch (error) {
            console.error('Error regenerating API key:', error);
            this.showMessage('An error occurred', 'error');
        }
    }

    revealApiKey() {
        const showBtn = document.getElementById('showApiKey');
        const apiKey = showBtn.dataset.apiKey;
        const apiKeySpan = document.querySelector('.api-key-masked');
        
        if (apiKeySpan.textContent.includes('•')) {
            apiKeySpan.innerHTML = `
                <code>${apiKey}</code>
                <button class="btn-icon" id="hideApiKey">
                    <i class="fas fa-eye-slash"></i>
                </button>
            `;
            
            document.getElementById('hideApiKey').addEventListener('click', () => {
                this.hideApiKey();
            });
        }
    }

    hideApiKey() {
        const apiKeySpan = document.querySelector('.api-key-masked');
        apiKeySpan.innerHTML = `
            ************************
            <button class="btn-icon" id="showApiKey">
                <i class="fas fa-eye"></i>
            </button>
        `;
        
        document.getElementById('showApiKey').addEventListener('click', () => {
            this.revealApiKey();
        });
    }

    // Utility methods
    isValidIP(ip) {
        const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
        return ipRegex.test(ip);
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    showMessage(message, type) {
        // Create message element if it doesn't exist
        let messageDiv = document.getElementById('nodesMessage');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'nodesMessage';
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

// Initialize nodes manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nodesManager = new NodesManager();
});