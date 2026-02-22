// API Configuration and Helper Functions
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const APP_ENV = import.meta.env.VITE_ENV || import.meta.env.MODE || 'development';

// Log environment configuration on module load (only in development)
if (import.meta.env.DEV) {
  console.log('🌍 Environment:', APP_ENV);
  console.log('🔗 API URL:', API_BASE_URL);
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
export const setAuthToken = (token: string): void => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('isAuthenticated');
};

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  console.log('API Request:', endpoint, 'Token:', token ? 'Present' : 'Missing');

  const headers: any = {
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // Only set Content-Type to application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    // Check if Content-Type is not already provided in options.headers
    const hasContentType = options.headers && Object.keys(options.headers).some(k => k.toLowerCase() === 'content-type');
    if (!hasContentType) {
      headers['Content-Type'] = 'application/json';
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Log response status for debugging
    console.log('API Response:', endpoint, 'Status:', response.status);

    // Handle 401 Unauthorized - Token expired or invalid
    if (response.status === 401) {
      console.log('🔒 Token expired or invalid - logging out');
      removeAuthToken();
      // Redirect to login page
      window.location.href = '/login';
      throw new Error('Session expired. Please login again.');
    }

    // Try to parse response as JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      throw new Error(`Server returned ${response.status}: Unable to parse response`);
    }

    if (!response.ok) {
      console.error('API Error:', data);
      // Include validation errors if present
      const errorMessage = data.errors
        ? `${data.message}: ${data.errors.map((e: any) => e.msg || e.message).join(', ')}`
        : (data.message || `Request failed with status ${response.status}`);
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API Request failed:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network error occurred');
  }
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await apiRequest<{ success: boolean; data: { token: string; id: string; name: string; email: string; role: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    console.log('Login response:', response);
    if (response.data?.token) {
      setAuthToken(response.data.token);
      console.log('Token saved:', response.data.token);
      console.log('Token retrieved:', getAuthToken());
    }
    return response;
  },

  register: async (userData: any) => {
    const response = await apiRequest<{ success: boolean; data: { token: string;[key: string]: any } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (response.data?.token) {
      setAuthToken(response.data.token);
    }
    return response;
  },

  getCurrentUser: async () => {
    return apiRequest<{ success: boolean; data: any }>('/auth/me');
  },

  updatePassword: async (data: any) => {
    return apiRequest<{ success: boolean; message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// Inventory API
export const inventoryAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(`/inventory${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/inventory/${id}`);
  },

  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/inventory', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/inventory/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/inventory/${id}`, {
      method: 'DELETE',
    });
  },

  getStats: async () => {
    return apiRequest<{ success: boolean; data: any }>('/inventory/stats/summary');
  },
};

// Customer API
export const customerAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(`/customers${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/customers/${id}`);
  },

  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Forms API
export const formsAPI = {
  // Biyana
  getBiyanaForms: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/forms/biyana');
  },

  getArchivedBiyanaForms: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/forms/biyana/archived');
  },

  createBiyana: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/forms/biyana', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Sale Agreement
  getSaleAgreements: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/forms/sale-agreement');
  },

  getSaleAgreementById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/forms/sale-agreement/${id}`);
  },

  createSaleAgreement: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/forms/sale-agreement', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approveSaleAgreement: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/forms/sale-agreement/${id}/approve`, {
      method: 'PUT',
    });
  },

  // Transfer
  getTransferForms: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any[] }>(`/transfer${queryString}`);
  },

  getArchivedTransferForms: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/transfer/archived');
  },

  getTransferById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/transfer/${id}`);
  },

  createTransfer: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/transfer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  approveTransfer: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/transfer/${id}/approve`, {
      method: 'PUT',
    });
  },

  rejectTransfer: async (id: string, reason?: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/transfer/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ reason }),
    });
  },

  completeTransfer: async (id: string, newSaleAgreementId: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/transfer/${id}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ newSaleAgreementId }),
    });
  },
};

// Voucher API
export const voucherAPI = {
  getAll: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(`/vouchers${queryString}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ success: boolean; data: any }>(`/vouchers/${id}`);
  },

  getArchived: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any[]; pagination: any }>(`/vouchers/archived/all${queryString}`);
  },

  create: async (data: any) => {
    return apiRequest<{ success: boolean; data: any }>('/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest<{ success: boolean; data: any }>(`/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/vouchers/${id}`, {
      method: 'DELETE',
    });
  },
};

// Reports API
export const reportsAPI = {
  getDashboardStats: async () => {
    return apiRequest<{ success: boolean; data: any }>('/reports/dashboard');
  },

  getSalesReport: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any }>(`/reports/sales${queryString}`);
  },

  getPaymentReport: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any }>(`/reports/payments${queryString}`);
  },

  getComparisonReport: async (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest<{ success: boolean; data: any }>(`/reports/comparison${queryString}`);
  },
};

// Users API (Admin only)
export const usersAPI = {
  getAll: async () => {
    return apiRequest<{ success: boolean; data: any[] }>('/users');
  },

  create: async (userData: any) => {
    const isFormData = userData instanceof FormData;
    return apiRequest<{ success: boolean; data: any }>('/users', {
      method: 'POST',
      body: isFormData ? userData : JSON.stringify(userData),
    });
  },

  update: async (id: string, userData: any) => {
    const isFormData = userData instanceof FormData;
    return apiRequest<{ success: boolean; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: isFormData ? userData : JSON.stringify(userData),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

export default {
  auth: authAPI,
  inventory: inventoryAPI,
  customer: customerAPI,
  forms: formsAPI,
  voucher: voucherAPI,
  reports: reportsAPI,
  users: usersAPI,
};
