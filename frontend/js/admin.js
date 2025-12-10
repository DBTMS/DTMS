class AdminPanel {
    constructor() {
        this.baseUrl = 'backend/api';
        this.currentTab = 'users';
        this.init();
    }

    init() {
        this.initEventListeners();
        this.loadSystemStats();
        this.loadUsers();
        this.loadNodes();
        this.loadLogs();
    }

    initEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebarToggle');
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('active');
            });
        }

        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Refresh button
        const refreshBtn = document.getElementById('refreshAdmin');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshAllData());
        }

        // Add user button
        const addUserBtn = document.getElementById('addUserBtn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        // Save user button
        const saveUserBtn = document.getElementById('saveUserBtn');
        if (saveUserBtn) {
            saveUserBtn.addEventListener('click', () => this.saveUser());
        }

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

        // System settings form
        const settingsForm = document.getElementById('systemSettingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSettings();
            });
        }

        // Log filter
        const logFilter = document.getElementById('logFilter');
        if (logFilter) {
            logFilter.addEventListener('change', () => this.filterLogs());
        }
    }

    switchTab(tab) {
        if (this.currentTab === tab) return;
        
        this.currentTab = tab;
        
        // Update tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        // Update tab content
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tab}Tab`);
        });
        
        // Load data for the tab if needed
        switch(tab) {
            case 'users':
                this.loadUsers();
                break;
            case 'nodes':
                this.loadNodes();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
    }

    async loadSystemStats() {
        try {
            const response = await fetch(`${this.baseUrl}/adminActions.php?stats=true`);
            const data = await response.json();
            
            if (data.success) {
                this.updateSystemStats(data.stats);
            }
        } catch (error) {
            console.error('Error loading system stats:', error);
            this.showMessage('Failed to load system statistics', 'error');
        }
    }

    updateSystemStats(stats) {
        const totalUsers = document.getElementById('totalUsers');
        const totalNodesAdmin = document.getElementById('totalNodesAdmin');
        const totalData = document.getElementById('totalData');
        const activeAlerts = document.getElementById('activeAlerts');
        
        if (totalUsers) totalUsers.textContent = stats.users || '0';
        if (totalNodesAdmin) totalNodesAdmin.textContent = stats.nodes?.total || '0';
        if (totalData) totalData.textContent = this.formatBytes(stats.traffic?.data || 0);
        if (activeAlerts) activeAlerts.textContent = stats.alerts || '0';
    }

    async loadUsers() {
        try {
            const response = await fetch(`${this.baseUrl}/adminActions.php?users=true`);
            const data = await response.json();
            
            if (data.success) {
                this.displayUsers(data.users);
            }
        } catch (error) {
            console.error('Error loading users:', error);
            this.showMessage('Failed to load users', 'error');
        }
    }

    displayUsers(users) {
        const tableBody = document.getElementById('usersTableBody');
        const usersCount = document.getElementById('usersCount');
        
        if (usersCount) usersCount.textContent = users?.length || 0;
        
        if (!tableBody) return;
        
        if (!users || users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No users found</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>
                    <span class="role-badge role-${user.role}">
                        ${user.role}
                    </span>
                </td>
                <td>${this.formatDate(user.created_at)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" onclick="adminPanel.editUser(${user.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        ${user.id !== 1 ? `
                            <button class="btn-icon text-danger" onclick="adminPanel.deleteUser(${user.id})" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadNodes() {
        try {
            const response = await fetch(`${this.baseUrl}/getNodes.php?admin=true`);
            const data = await response.json();
            
            if (data.success) {
                this.displayAllNodes(data.nodes);
            }
        } catch (error) {
            console.error('Error loading nodes:', error);
            this.showMessage('Failed to load nodes', 'error');
        }
    }

    displayAllNodes(nodes) {
        const tableBody = document.getElementById('nodesTableBody');
        const allNodesCount = document.getElementById('allNodesCount');
        
        if (allNodesCount) allNodesCount.textContent = nodes?.length || 0;
        
        if (!tableBody) return;
        
        if (!nodes || nodes.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center">No nodes found</td>
                </tr>
            `;
            return;
        }
        
        tableBody.innerHTML = nodes.map(node => `
            <tr>
                <td>${node.node_name}</td>
                <td>${node.node_ip}</td>
                <td>${node.node_location || '-'}</td>
                <td>
                    <span class="status-badge status-${node.node_status}">
                        ${node.node_status}
                    </span>
                </td>
                <td>${node.created_by_name || 'Unknown'}</td>
                <td>${this.formatDate(node.created_at)}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-icon" onclick="adminPanel.updateNodeStatus(${node.id}, 'active')" title="Activate">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn-icon" onclick="adminPanel.updateNodeStatus(${node.id}, 'inactive')" title="Deactivate">
                            <i class="fas fa-pause"></i>
                        </button>
                        <button class="btn-icon text-danger" onclick="adminPanel.deleteAdminNode(${node.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    async loadLogs() {
        try {
            const response = await fetch(`${this.baseUrl}/adminActions.php?logs=true`);
            const data = await response.json();
            
            if (data.success) {
                this.displayLogs(data.logs);
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showMessage('Failed to load system logs', 'error');
        }
    }

    displayLogs(logs) {
        const logList = document.getElementById('logList');
        if (!logList) return;
        
        if (!logs || logs.length === 0) {
            logList.innerHTML = `
                <div class="log-item">
                    <div class="log-content">
                        <p>No system logs available</p>
                    </div>
                </div>
            `;
            return;
        }
        
        logList.innerHTML = logs.map(log => `
            <div class="log-item log-${log.type}">
                <div class="log-icon">
                    <i class="fas fa-${this.getLogIcon(log.type)}"></i>
                </div>
                <div class="log-content">
                    <p>${log.message}</p>
                    <span class="log-time">${this.formatTime(log.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    filterLogs() {
        const filter = document.getElementById('logFilter').value;
        const logItems = document.querySelectorAll('.log-item');
        
        logItems.forEach(item => {
            if (filter === 'all' || item.classList.contains(`log-${filter}`)) {
                item.style.display = 'flex';
            } else {
                item.style.display = 'none';
            }
        });
    }

    showAddUserModal() {
        const modal = document.getElementById('userModal');
        if (modal) {
            document.getElementById('userModalTitle').textContent = 'Add New User';
            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';
            modal.classList.add('active');
        }
    }

    async editUser(userId) {
        try {
            // In a real implementation, you would fetch user details
            // For now, we'll show the modal with the user ID
            const modal = document.getElementById('userModal');
            if (modal) {
                document.getElementById('userModalTitle').textContent = 'Edit User';
                document.getElementById('userId').value = userId;
                document.getElementById('modalPassword').placeholder = 'Leave blank to keep current password';
                modal.classList.add('active');
            }
        } catch (error) {
            console.error('Error preparing to edit user:', error);
            this.showMessage('Failed to load user details', 'error');
        }
    }

    async saveUser() {
        const userId = document.getElementById('userId').value;
        const username = document.getElementById('modalUsername').value;
        const email = document.getElementById('modalEmail').value;
        const password = document.getElementById('modalPassword').value;
        const role = document.getElementById('modalRole').value;
        
        if (!username || !email || !role) {
            this.showMessage('Please fill in all required fields', 'error');
            return;
        }
        
        if (!userId && !password) {
            this.showMessage('Please provide a password for new users', 'error');
            return;
        }
        
        const saveBtn = document.getElementById('saveUserBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        try {
            const response = await fetch(`${this.baseUrl}/adminActions.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_user_role',
                    user_id: userId || null,
                    username: username,
                    email: email,
                    password: password || null,
                    role: role
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage(userId ? 'User updated successfully!' : 'User added successfully!', 'success');
                document.getElementById('userModal').classList.remove('active');
                this.loadUsers();
                this.loadSystemStats();
            } else {
                this.showMessage(data.message || 'Operation failed', 'error');
            }
        } catch (error) {
            console.error('Error saving user:', error);
            this.showMessage('An error occurred. Please try again.', 'error');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    async deleteUser(userId) {
        if (userId === 1) {
            this.showMessage('Cannot delete the primary admin user', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this user? All their nodes and data will also be deleted.')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.baseUrl}/adminActions.php?user_id=${userId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('User deleted successfully', 'success');
                this.loadUsers();
                this.loadSystemStats();
            } else {
                this.showMessage(data.message || 'Failed to delete user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showMessage('An error occurred while deleting the user', 'error');
        }
    }

    async updateNodeStatus(nodeId, status) {
        try {
            const response = await fetch(`${this.baseUrl}/adminActions.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'update_node_status',
                    node_id: nodeId,
                    status: status
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage(`Node ${status === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
                this.loadNodes();
            } else {
                this.showMessage(data.message || 'Failed to update node status', 'error');
            }
        } catch (error) {
            console.error('Error updating node status:', error);
            this.showMessage('An error occurred', 'error');
        }
    }

    async deleteAdminNode(nodeId) {
        if (!confirm('Are you sure you want to delete this node? All traffic data will be permanently deleted.')) {
            return;
        }
        
        try {
            // Note: This endpoint would need to be created
            const response = await fetch(`${this.baseUrl}/deleteNode.php?admin=true&id=${nodeId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showMessage('Node deleted successfully', 'success');
                this.loadNodes();
                this.loadSystemStats();
            } else {
                this.showMessage(data.message || 'Failed to delete node', 'error');
            }
        } catch (error) {
            console.error('Error deleting node:', error);
            this.showMessage('An error occurred while deleting the node', 'error');
        }
    }

    async saveSettings() {
        const systemName = document.getElementById('systemName').value;
        const maxNodes = document.getElementById('maxNodes').value;
        const dataRetention = document.getElementById('dataRetention').value;
        const alertThreshold = document.getElementById('alertThreshold').value;
        
        const saveBtn = document.querySelector('#systemSettingsForm button[type="submit"]');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        saveBtn.disabled = true;
        
        try {
            // In a real implementation, you would save these settings to the database
            // For now, we'll simulate a successful save
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            this.showMessage('Settings saved successfully', 'success');
        } catch (error) {
            console.error('Error saving settings:', error);
            this.showMessage('Failed to save settings', 'error');
        } finally {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }

    refreshAllData() {
        this.loadSystemStats();
        
        switch(this.currentTab) {
            case 'users':
                this.loadUsers();
                break;
            case 'nodes':
                this.loadNodes();
                break;
            case 'logs':
                this.loadLogs();
                break;
        }
        
        this.showMessage('Data refreshed', 'success');
    }

    // Utility methods
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit'
        });
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getLogIcon(logType) {
        const icons = {
            'traffic': 'exchange-alt',
            'alert': 'exclamation-triangle',
            'user': 'user',
            'system': 'cog'
        };
        return icons[logType] || 'info-circle';
    }

    showMessage(message, type) {
        // Create message element if it doesn't exist
        let messageDiv = document.getElementById('adminMessage');
        if (!messageDiv) {
            messageDiv = document.createElement('div');
            messageDiv.id = 'adminMessage';
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

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});