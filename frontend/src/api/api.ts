import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000',  // Match backend domain
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log('Request:', {
      url: config.url,
      method: config.method,
      headers: config.headers,
      withCredentials: config.withCredentials,
      cookies: document.cookie  // Log current cookies for debugging
    });
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('Response:', {
      url: response.config.url,
      status: response.status,
      headers: response.headers,
      data: response.data,
      setCookie: response.headers['set-cookie']  // Log if Set-Cookie header is present
    });
    return response;
  },
  (error) => {
    console.error('Response error:', {
      url: error.response?.config.url,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers,
    });
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/signup' && currentPath !== '/') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
