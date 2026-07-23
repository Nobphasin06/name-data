// auth.js
function getAccessToken() {
    return localStorage.getItem('token');
}

function setTokens(token) {
    localStorage.setItem('token', token);
}

function clearTokens() {
    localStorage.removeItem('token');
}

function requireAuth() {
    if (!getAccessToken()) {
        window.location.href = 'login.html';
    }
}

function redirectIfLoggedIn() {
    if (getAccessToken()) {
        window.location.href = 'index.html';
    }
}

async function authFetch(url, options = {}) {
    const token = getAccessToken();
    
    // Setup headers
    if (!options.headers) {
        options.headers = {};
    }
    
    // Only set Content-Type if it's not FormData (FormData sets it automatically)
    if (!(options.body instanceof FormData)) {
        if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }
    }
    
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    let response = await fetch(url, options);

    // Handle token expiration (401 or 403)
    if (response.status === 401 || response.status === 403) {
        clearTokens();
        window.location.href = 'login.html';
    }

    return response;
}

// Global logout function
function logout() {
    clearTokens();
    window.location.href = 'login.html';
}
