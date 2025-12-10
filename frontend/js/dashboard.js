console.log("dashboard.js loaded");

// ==========================
// CHECK LOGIN
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Dashboard loaded, checking auth...");
    
    // Check localStorage
    let user = localStorage.getItem("user");
    console.log("User from localStorage:", user);
    
    if (!user) {
        console.log("No user in localStorage, redirecting to login...");
        window.location.href = "login.html";
        return;
    }

    try {
        user = JSON.parse(user);
        
        // Verify user has required properties
        if (!user.username || !user.role) {
            console.error("Invalid user object:", user);
            localStorage.removeItem("user");
            window.location.href = "login.html";
            return;
        }
        
        console.log("User authenticated:", user.username, "Role:", user.role);
        
        document.getElementById("usernameDisplay").textContent = user.username;
        document.getElementById("userRoleDisplay").textContent = user.role;

        if (user.role === "admin") {
            document.getElementById("adminLink").classList.remove("hidden");
        }

        // Load dashboard data
        loadDashboardStats();
        loadRecentActivity();
        loadNodes();
        
    } catch (err) {
        console.error("Error parsing user:", err);
        localStorage.removeItem("user");
        window.location.href = "login.html";
    }
});
// ==========================
// LOGOUT
// ==========================
const logoutBtn = document.getElementById("logoutBtn");
if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("user");
        window.location.href = "login.html";
    });
}

// ==========================
// LOAD DASHBOARD STATS
// ==========================
async function loadDashboardStats() {
    try {
        let res = await fetch("../backend/app/getTraffic.php");
        let data = await res.json();

        if (data.success) {
            document.getElementById("totalNodes").textContent = data.data.stats.totalNodes || 0;
            document.getElementById("totalTraffic").textContent = data.data.stats.totalTraffic || 0;
            document.getElementById("totalAlerts").textContent = data.data.stats.activeAlerts || 0;
            document.getElementById("bandwidthUsage").textContent = (data.data.stats.bandwidthUsage || 0) + " MB";
            
            if (data.data.trafficData && data.data.protocolData) {
                loadCharts(data.data.trafficData, data.data.protocolData);
            }
        } else {
            console.error("Error loading stats:", data.error);
        }
    } catch (err) {
        console.error("Network error:", err);
    }
}

// ==========================
// LOAD CHARTS
// ==========================
function loadCharts(trafficData, protocolData) {
    // Traffic Chart
    const trafficCtx = document.getElementById("trafficChart");
    if (trafficCtx) {
        const hours = trafficData.map(item => item.hour);
        const packets = trafficData.map(item => item.packets || 0);
        
        new Chart(trafficCtx, {
            type: "line",
            data: {
                labels: hours,
                datasets: [{
                    label: "Traffic (packets)",
                    data: packets,
                    borderWidth: 2,
                    borderColor: '#4CAF50',
                    backgroundColor: 'rgba(76, 175, 80, 0.1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Protocol Chart
    const protocolCtx = document.getElementById("protocolChart");
    if (protocolCtx) {
        const labels = protocolData.map(item => item.protocol);
        const counts = protocolData.map(item => item.count);
        
        new Chart(protocolCtx, {
            type: "pie",
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4CAF50', '#9966FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

// ==========================
// LOAD RECENT ACTIVITY
// ==========================
async function loadRecentActivity() {
    try {
        let res = await fetch("../backend/app/adminActions.php");
        let data = await res.json();

        const activityList = document.getElementById("activityList");
        if (!activityList) return;

        activityList.innerHTML = "";

        if (data && data.length > 0) {
            data.forEach(item => {
                activityList.innerHTML += `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-server text-primary"></i>
                    </div>
                    <div class="activity-content">
                        <p>${item.message || 'Activity'}</p>
                        <span class="activity-time">${item.time || 'Just now'}</span>
                    </div>
                </div>`;
            });
        } else {
            activityList.innerHTML = `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-info-circle text-muted"></i>
                    </div>
                    <div class="activity-content">
                        <p>No recent activity</p>
                        <span class="activity-time">-</span>
                    </div>
                </div>`;
        }
    } catch (err) {
        console.error("Error loading activity:", err);
    }
}

// ==========================
// LOAD NODES
// ==========================
async function loadNodes() {
    try {
        let res = await fetch("../backend/app/getNodes.php");
        let data = await res.json();

        const nodesGrid = document.getElementById("nodesGrid");
        const nodesCount = document.getElementById("nodesCount");
        if (!nodesGrid) return;

        nodesGrid.innerHTML = "";

        if (data && data.success && data.data && data.data.length > 0) {
            data.data.forEach(n => {
                nodesGrid.innerHTML += `
                <div class="node-card">
                    <h4>${n.name || 'Unnamed Node'}</h4>
                    <p><strong>IP:</strong> ${n.ip || 'N/A'}</p>
                    <p><strong>Location:</strong> ${n.location || 'N/A'}</p>
                    <p><strong>Type:</strong> ${n.type || 'server'}</p>
                    <span class="status ${n.status || 'inactive'}">${(n.status || 'inactive').toUpperCase()}</span>
                </div>`;
            });
            
            if (nodesCount) {
                nodesCount.textContent = data.data.length;
            }
        } else {
            nodesGrid.innerHTML = `
                <div class="no-nodes">
                    <i class="fas fa-server fa-3x"></i>
                    <p>No nodes added yet</p>
                    <button class="btn btn-primary" id="addFirstNode">
                        <i class="fas fa-plus"></i> Add Your First Node
                    </button>
                </div>`;
        }
    } catch (err) {
        console.error("Error loading nodes:", err);
    }
}

// ==========================
// ADD NODE
// ==========================
const saveNodeBtn = document.getElementById("saveNodeBtn");
if (saveNodeBtn) {
    saveNodeBtn.addEventListener("click", async () => {
        let form = document.getElementById("addNodeForm");
        let formData = new FormData(form);

        try {
            let res = await fetch("../backend/app/addNode.php", {
                method: "POST",
                body: formData
            });

            let data = await res.json();

            if (data.status === "success" || data.success) {
                alert("Node added successfully");
                loadNodes();
                document.querySelector(".modal").style.display = "none";
                form.reset();
            } else {
                alert("Failed: " + (data.message || "Unknown error"));
            }
        } catch (err) {
            console.error("Error adding node:", err);
            alert("Network error adding node");
        }
    });
}

// ==========================
// MODAL HANDLING
// ==========================
const addNodeBtn = document.getElementById("addNodeBtn");
const addFirstNode = document.getElementById("addFirstNode");
const closeModalBtns = document.querySelectorAll(".close-modal");
const modal = document.getElementById("addNodeModal");

if (addNodeBtn) {
    addNodeBtn.addEventListener("click", () => {
        if (modal) modal.style.display = "block";
    });
}

if (addFirstNode) {
    addFirstNode.addEventListener("click", () => {
        if (modal) modal.style.display = "block";
    });
}

closeModalBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });
});

// Close modal when clicking outside
window.addEventListener("click", (e) => {
    if (modal && e.target === modal) {
        modal.style.display = "none";
    }
});