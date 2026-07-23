// auth.js
function getAccessToken() {
    return localStorage.getItem('accessToken');
}

function setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
            // Attempt to refresh
            try {
                const refreshRes = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token: refreshToken })
                });

                if (refreshRes.ok) {
                    const data = await refreshRes.json();
                    setTokens(data.accessToken, refreshToken);
                    
                    // Retry original request
                    options.headers['Authorization'] = `Bearer ${data.accessToken}`;
                    response = await fetch(url, options);
                } else {
                    // Refresh failed, clear and redirect
                    clearTokens();
                    window.location.href = 'login.html';
                }
            } catch (err) {
                clearTokens();
                window.location.href = 'login.html';
            }
        } else {
            clearTokens();
            window.location.href = 'login.html';
        }
    }

    return response;
}

// Global logout function
async function logout() {
    const token = getAccessToken();
    if (token) {
        await authFetch('/api/auth/logout', { method: 'POST' });
    }
    clearTokens();
    window.location.href = 'login.html';
}
