const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

class ApiService {
  constructor() {
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  // Subscribe to token refresh
  subscribeTokenRefresh(callback) {
    this.refreshSubscribers.push(callback);
  }

  // Notify all subscribers when token is refreshed
  onTokenRefreshed(newToken) {
    this.refreshSubscribers.forEach(callback => callback(newToken));
    this.refreshSubscribers = [];
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    localStorage.setItem('accessToken', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('refreshToken', data.refreshToken);
    }
    return data.accessToken;
  }

  async request(endpoint, options = {}, retry = true) {
    const token = localStorage.getItem('accessToken');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && retry && !endpoint.includes('/auth/')) {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const newToken = await this.refreshToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);
          // Retry the original request with new token
          return this.request(endpoint, options, false);
        } catch (refreshError) {
          this.isRefreshing = false;
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          throw new Error('Session expired. Please log in again.');
        }
      } else {
        // Wait for the token to be refreshed
        return new Promise((resolve, reject) => {
          this.subscribeTokenRefresh((newToken) => {
            config.headers.Authorization = `Bearer ${newToken}`;
            fetch(`${API_BASE_URL}${endpoint}`, config)
              .then(res => {
                if (!res.ok) throw new Error('Request failed');
                return res.text();
              })
              .then(text => resolve(text ? JSON.parse(text) : null))
              .catch(reject);
          });
        });
      }
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: `HTTP ${response.status}: ${response.statusText}` }));
      throw new Error(error.message || error.error || 'Request failed');
    }
    
    // Handle empty responses (like 204 No Content)
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  put(endpoint, data) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const apiService = new ApiService();
