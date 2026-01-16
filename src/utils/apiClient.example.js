// Frontend Token Refresh Implementation Guide
// Add this to your API client or axios interceptor

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Call refresh endpoint
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { token } = response.data.data;

        // Save new token
        localStorage.setItem('token', token);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${token}`;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// ============================================
// How to use in your components
// ============================================

// Instead of:
// import { API_URL } from './constants';
// const response = await fetch(`${API_URL}/...`);

// Use:
// import apiClient from './apiClient';
// const response = await apiClient.get('/endpoint');
// const response = await apiClient.post('/endpoint', data);

// ============================================
// Update your login handler
// ============================================

export const loginUser = async (credentials) => {
  try {
    const response = await apiClient.post('/auth/login', credentials);
    
    if (response.data.success) {
      const { token, refreshToken, ...user } = response.data.data;
      
      // Store both tokens
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      
      return response.data;
    }
  } catch (error) {
    throw error;
  }
};

// ============================================
// Update your logout handler
// ============================================

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

// ============================================
// Password Validation Helper
// ============================================

export const validatePassword = (password) => {
  const minLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);

  return {
    isValid: minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar,
    errors: {
      minLength: !minLength ? 'Password must be at least 8 characters' : null,
      hasUpperCase: !hasUpperCase ? 'Password must contain an uppercase letter' : null,
      hasLowerCase: !hasLowerCase ? 'Password must contain a lowercase letter' : null,
      hasNumber: !hasNumber ? 'Password must contain a number' : null,
      hasSpecialChar: !hasSpecialChar ? 'Password must contain a special character (@$!%*?&)' : null,
    },
  };
};

// ============================================
// Example Usage in React Component
// ============================================

/*
import { useState, useEffect } from 'react';
import apiClient from './apiClient';

function MyComponent() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Token refresh happens automatically if needed
        const response = await apiClient.get('/forms/biyana');
        setData(response.data.data);
      } catch (error) {
        console.error('Error:', error);
        // If refresh failed, user will be redirected to login
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      {loading ? 'Loading...' : 'Data loaded'}
    </div>
  );
}
*/

// ============================================
// Rate Limit Error Handling
// ============================================

export const handleRateLimitError = (error) => {
  if (error.response?.status === 429) {
    const message = error.response.data.message || 'Too many requests. Please try again later.';
    
    // Show user-friendly message
    alert(message);
    
    // Optionally, extract retry-after header
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      console.log(`Retry after ${retryAfter} seconds`);
    }
    
    return true;
  }
  return false;
};

// ============================================
// Validation Error Handling
// ============================================

export const handleValidationErrors = (error) => {
  if (error.response?.status === 400 && error.response.data.errors) {
    // Format validation errors for display
    const errors = error.response.data.errors.reduce((acc, err) => {
      acc[err.field] = err.message;
      return acc;
    }, {});
    
    return errors;
  }
  return null;
};

// Example usage with form:
/*
const handleSubmit = async (formData) => {
  try {
    await apiClient.post('/forms/biyana', formData);
    alert('Success!');
  } catch (error) {
    if (handleRateLimitError(error)) {
      return;
    }
    
    const validationErrors = handleValidationErrors(error);
    if (validationErrors) {
      setFormErrors(validationErrors);
      return;
    }
    
    // Other errors
    alert('An error occurred');
  }
};
*/
