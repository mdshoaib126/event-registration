import api from './api';
import Cookies from 'js-cookie';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'event_staff';
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role: 'admin' | 'event_staff';
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post('/auth/login', credentials);
    const data = response.data;
    
    // Store token in cookie
    Cookies.set('auth_token', data.access_token, {
      expires: 7, // 7 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Store user data in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    // Update axios default headers immediately
    if (typeof window !== 'undefined') {
      const api = require('./api').default;
      api.defaults.headers.Authorization = `Bearer ${data.access_token}`;
    }
    
    return data;
  }

  async register(data: RegisterData): Promise<{ message: string; user: User }> {
    const response = await api.post('/auth/register', data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
    } finally {
      // Clear stored data
      Cookies.remove('auth_token');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }
    }
  }

  async getUserProfile(): Promise<User> {
    const response = await api.get('/auth/user-profile');
    return response.data;
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await api.post('/auth/refresh');
    const data = response.data;
    
    // Update token in cookie
    Cookies.set('auth_token', data.access_token, {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    return data;
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  }

  getToken(): string | undefined {
    return Cookies.get('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  isEventStaff(): boolean {
    const user = this.getUser();
    return user?.role === 'event_staff';
  }
}

export default new AuthService();