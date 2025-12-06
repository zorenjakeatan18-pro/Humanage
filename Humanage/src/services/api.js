// services/api.js - API Service for Backend Connection
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ==================== AUTH API ====================
export const authAPI = {
  login: async (email, password) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  },

  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  getMe: async () => {
    return apiCall('/auth/me');
  },

  updateProfile: async (profileData) => {
    return apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }
};

// ==================== EMPLOYEES API ====================
export const employeesAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/employees?${queryParams}` : '/employees';
    return apiCall(endpoint);
  },

  getById: async (id) => {
    return apiCall(`/employees/${id}`);
  },

  create: async (employeeData) => {
    return apiCall('/employees', {
      method: 'POST',
      body: JSON.stringify(employeeData)
    });
  },

  update: async (id, employeeData) => {
    return apiCall(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(employeeData)
    });
  },

  delete: async (id) => {
    return apiCall(`/employees/${id}`, {
      method: 'DELETE'
    });
  },

  getStats: async () => {
    return apiCall('/employees/stats/summary');
  }
};

// ==================== ATTENDANCE API ====================
export const attendanceAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/attendance?${queryParams}` : '/attendance';
    return apiCall(endpoint);
  },

  create: async (attendanceData) => {
    return apiCall('/attendance', {
      method: 'POST',
      body: JSON.stringify(attendanceData)
    });
  },

  update: async (id, attendanceData) => {
    return apiCall(`/attendance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(attendanceData)
    });
  },

  delete: async (id) => {
    return apiCall(`/attendance/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==================== PAYROLL API ====================
export const payrollAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/payroll?${queryParams}` : '/payroll';
    return apiCall(endpoint);
  },

  getById: async (id) => {
    return apiCall(`/payroll/${id}`);
  },

  create: async (payrollData) => {
    return apiCall('/payroll', {
      method: 'POST',
      body: JSON.stringify(payrollData)
    });
  },

  update: async (id, payrollData) => {
    return apiCall(`/payroll/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payrollData)
    });
  },

  delete: async (id) => {
    return apiCall(`/payroll/${id}`, {
      method: 'DELETE'
    });
  },

  getStats: async () => {
    return apiCall('/payroll/stats/summary');
  }
};

// ==================== PERFORMANCE API ====================
export const performanceAPI = {
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/performance?${queryParams}` : '/performance';
    return apiCall(endpoint);
  },

  create: async (performanceData) => {
    return apiCall('/performance', {
      method: 'POST',
      body: JSON.stringify(performanceData)
    });
  },

  update: async (id, performanceData) => {
    return apiCall(`/performance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(performanceData)
    });
  },

  delete: async (id) => {
    return apiCall(`/performance/${id}`, {
      method: 'DELETE'
    });
  }
};

// ==================== DASHBOARD API ====================
export const dashboardAPI = {
  getStats: async () => {
    return apiCall('/dashboard/stats');
  }
};

export default {
  auth: authAPI,
  employees: employeesAPI,
  attendance: attendanceAPI,
  payroll: payrollAPI,
  performance: performanceAPI,
  dashboard: dashboardAPI
};