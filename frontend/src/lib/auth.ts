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
    
    // Store token in cookie with production-safe settings
    Cookies.set('auth_token', data.access_token, {
      expires: 7, // 7 days
      secure: false, // Set to false for HTTP
      sameSite: 'lax',
      path: '/'
    });
    
    // Store user data in localStorage with error handling
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('auth_token', data.access_token);
        console.log('User data stored in localStorage:', data.user);
      } catch (error) {
        console.error('Failed to store user data:', error);
      }
    }
    
    // Update axios default headers immediately
    if (typeof window !== 'undefined') {
      import('./api').then(({ default: api }) => {
        api.defaults.headers.Authorization = `Bearer ${data.access_token}`;
        console.log('Authorization header set:', api.defaults.headers.Authorization);
      });
    }
    
    // Small delay to ensure data is properly stored
    await new Promise(resolve => setTimeout(resolve, 100));
    
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
    
    try {
      const userData = localStorage.getItem('user');
      console.log('Retrieved user data from localStorage:', userData);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error);
      return null;
    }
  }

  getToken(): string | undefined {
    // Try localStorage first, then cookies
    if (typeof window !== 'undefined') {
      const tokenFromStorage = localStorage.getItem('auth_token');
      if (tokenFromStorage) {
        console.log('Token found in localStorage');
        return tokenFromStorage;
      }
    }
    
    const tokenFromCookie = Cookies.get('auth_token');
    console.log('Token from cookie:', tokenFromCookie ? 'found' : 'not found');
    return tokenFromCookie;
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