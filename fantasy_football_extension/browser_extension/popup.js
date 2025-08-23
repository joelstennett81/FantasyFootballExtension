function getApiBaseUrl() {
    // if you're on your own localhost testing Sleeper clone
    if (["localhost", "127.0.0.1"].includes(window.location.hostname)) {
        return "http://127.0.0.1:8000";
    }
    // if you're actually on sleeper.com
    return "https://fantasyfootballextension.onrender.com";
}


const token = localStorage.getItem("authToken");

function show(el) {
    el.classList.remove("hidden");
}

function hide(el) {
    el.classList.add("hidden");
}

function setAuthMessage(msg) {
    document.getElementById("auth-message").innerText = msg;
}

function showRankingsSection() {
    hide(document.getElementById("mode-selection"));
    hide(document.getElementById("auth-section"));
    show(document.getElementById("rankings-section"));
}

function showAuthSection(isRegister) {
    show(document.getElementById("auth-section"));
    hide(document.getElementById("mode-selection"));
    hide(document.getElementById("rankings-section"));
    setAuthMessage("");

    const nameFields = document.getElementById("name-fields");
    const loginBtn = document.getElementById("login-btn");
    const registerBtn = document.getElementById("register-btn");

    if (isRegister) {
        show(nameFields);
        hide(loginBtn);
        show(registerBtn);
    } else {
        hide(nameFields);
        show(loginBtn);
        hide(registerBtn);
    }
}

if (token) {
    showRankingsSection();
} else {
    show(document.getElementById("mode-selection"));
}

// Mode selection
document.getElementById("select-login").addEventListener("click", () => {
    showAuthSection(false);
});

document.getElementById("select-register").addEventListener("click", () => {
    showAuthSection(true);
});

// Log In
document.getElementById("login-btn").addEventListener("click", async () => {
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const res = await fetch(`${getApiBaseUrl()}/login/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({username: email, password})
    });

    const data = await res.json();
    if (res.ok) {
        localStorage.setItem("authToken", data.token);
        setAuthMessage("Login successful.");
        showRankingsSection();
    } else {
        setAuthMessage(data.error || data.non_field_errors?.[0] || "Login failed.");
    }
});

// Register
document.getElementById("register-btn").addEventListener("click", async () => {
    const first_name = document.getElementById("first-name").value;
    const last_name = document.getElementById("last-name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    if (!first_name || !last_name || !email || !password) {
        setAuthMessage("All fields are required.");
        return;
    }

    const res = await fetch(`${getApiBaseUrl()}/register/`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({email, password, first_name, last_name})
    });

    const data = await res.json();
    if (res.ok) {
        setAuthMessage("Registration successful. Please log in.");
        showAuthSection(false);
    } else {
        setAuthMessage(data.error || "Registration failed.");
    }
});

// Rankings
document.getElementById("load-rankings").addEventListener("click", () => {
    const token = localStorage.getItem("authToken");
    if (!token) {
        setAuthMessage("You must log in first.");
        return;
    }

    const message = {
        type: "SHOW_RANKINGS",
        filters: {
            num_teams: parseInt(document.getElementById("num_teams").value),
            ppr_type: document.getElementById("ppr_type").value,
            position: document.getElementById("position").value,
            sort_by: document.getElementById("sort_by").value,
            token: token
        }
    };

    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, message);
    });
});

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("authToken");
    setAuthMessage("Logged out.");
    show(document.getElementById("mode-selection"));
    hide(document.getElementById("auth-section"));
    hide(document.getElementById("rankings-section"));
});
