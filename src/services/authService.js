import { apiService } from './api';

class AuthService {
  async login(username, password) {
    const response = await apiService.post('/auth/login', { username, password });
    this.setTokens(response.accessToken, response.refreshToken);
    return { username: response.username };
  }

  async register(username, email, password) {
    const response = await apiService.post('/auth/register', {
      username,
      email,
      password,
    });
    this.setTokens(response.accessToken, response.refreshToken);
    return { username: response.username };
  }

  async logout() {
    try {
      await apiService.post('/auth/logout', {});
    } finally {
      this.clearTokens();
    }
  }

  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiService.post('/auth/refresh', { refreshToken });
    this.setTokens(response.accessToken, response.refreshToken);
    return response;
  }

  async getCurrentUser() {
    return apiService.get('/auth/me');
  }

  async verifyMasterPassword(masterPassword) {
    return apiService.post('/auth/verify-master', { masterPassword });
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  isAuthenticated() {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();
