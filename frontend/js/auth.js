console.log("auth.js loaded");

// API FOLDER path
const API_BASE = "../backend/api/";

// ==========================
// REGISTER
// ==========================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(registerForm);
        const btn = registerForm.querySelector('button[type="submit"]');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
        btn.disabled = true;

        const msg = document.getElementById("message");

        try {
            const res = await fetch(API_BASE + "register.php", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            msg.classList.remove("hidden");

            if (data.status === "success") {
                msg.style.color = "green";
                msg.innerHTML = data.message;
                
                // Save user data immediately
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                }
setTimeout(() => {
    window.location.href = "login.html";  
}, 1500);


            } else {
                msg.style.color = "red";
                msg.innerHTML = data.message;
            }
        } catch (err) {
            msg.classList.remove("hidden");
            msg.style.color = "red";
            msg.innerHTML = "Network Error!";
        }

        btn.innerHTML = oldText;
        btn.disabled = false;
    });
}

// ==========================
// LOGIN
// ==========================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const formData = new FormData(loginForm);
        const btn = loginForm.querySelector('button[type="submit"]');
        const oldText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        btn.disabled = true;

        const msg = document.getElementById("message");

        try {
            const res = await fetch(API_BASE + "login.php", {
                method: "POST",
                body: formData
            });

            const data = await res.json();
            msg.classList.remove("hidden");
            
            console.log("Login response:", data); // Debug log
            
            if (data.status === "success") {
                msg.style.color = "green";
                msg.innerHTML = data.message;
                
                // CRITICAL: Save user data to localStorage
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    console.log("User saved to localStorage:", data.user);
                } else if (data.data && data.data.user) {
                    // If structure is different
                    localStorage.setItem("user", JSON.stringify(data.data.user));
                    console.log("User saved to localStorage:", data.data.user);
                } else {
                    // Fallback: create user object from response
                    const userObj = {
                        username: data.username || formData.get('username'),
                        role: data.role || 'user',
                        id: data.id || data.user_id
                    };
                    localStorage.setItem("user", JSON.stringify(userObj));
                }

                // Redirect based on role
                setTimeout(() => {
                    if (data.user && data.user.role === "admin") {
                        window.location.href = "admin.html";
                    } else {
                        window.location.href = "dashboard.html";
                    }
                }, 1000);

            } else {
                msg.style.color = "red";
                msg.innerHTML = data.message || "Login failed";
            }

        } catch (err) {
            msg.classList.remove("hidden");
            msg.style.color = "red";
            msg.innerHTML = "Network error!";
            console.error("Login error:", err);
        }

        btn.innerHTML = oldText;
        btn.disabled = false;
    });
}