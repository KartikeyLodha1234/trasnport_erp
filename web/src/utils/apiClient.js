// ==========================================
// API CLIENT UTILITY - AUTOMATIC TOKEN HANDLING
// ==========================================

const API_BASE = 'http://localhost:8001/api';

/**
 * Get authentication token from localStorage
 */
const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Get headers with Authorization token
 */
const getHeaders = (additionalHeaders = {}) => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...additionalHeaders
  };
};

/**
 * Generic API request handler
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  
  const requestOptions = {
    ...options,
    headers: getHeaders(options.headers)
  };

  try {
    const response = await fetch(url, requestOptions);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired - logout
        localStorage.clear();
        window.location.href = '/login';
      }
      throw new Error(data.message || 'API Error');
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ==========================================
// API METHODS
// ==========================================

export const API = {
  // ---- AUTH ----
  login: (credentials) => 
    fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    }).then(r => r.json()),

  // ---- SHIPMENTS ----
  getShipments: () => apiRequest('/shipments', { method: 'GET' }),
  getShipment: (id) => apiRequest(`/shipments/${id}`, { method: 'GET' }),
  createShipment: (data) => apiRequest('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  updateShipment: (id, data) => apiRequest(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteShipment: (id) => apiRequest(`/shipments/${id}`, { method: 'DELETE' }),
  getChallan: (id) => apiRequest(`/shipments/${id}/challan`, { method: 'GET' }),

  // ---- DRIVERS ----
  getDrivers: () => apiRequest('/drivers', { method: 'GET' }),
  registerDriver: (formData) => {
    const token = getToken();
    return fetch(`${API_BASE}/drivers`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData
    }).then(r => r.json());
  },
  deleteDriver: (id) => apiRequest(`/drivers/${id}`, { method: 'DELETE' }),
  updateDriver: (id, data) => apiRequest(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  // ---- VEHICLES ----
  getVehicles: () => apiRequest('/vehicles', { method: 'GET' }),
  createVehicle: (data) => apiRequest('/vehicles', { method: 'POST', body: JSON.stringify(data) }),
  updateVehicle: (id, data) => apiRequest(`/vehicles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteVehicle: (id) => apiRequest(`/vehicles/${id}`, { method: 'DELETE' }),

  // ---- PAYMENTS ----
  getPayments: () => apiRequest('/payments', { method: 'GET' }),
  getDriverPayments: (driverId) => apiRequest(`/payments/driver/${driverId}`, { method: 'GET' }),
  createPayment: (data) => apiRequest('/payments', { method: 'POST', body: JSON.stringify(data) }),
  deletePayment: (id) => apiRequest(`/payments/${id}`, { method: 'DELETE' }),

  // ---- MAINTENANCE ----
  getMaintenance: () => apiRequest('/maintenance', { method: 'GET' }),
  createMaintenance: (data) => apiRequest('/maintenance', { method: 'POST', body: JSON.stringify(data) }),
  updateMaintenance: (id, data) => apiRequest(`/maintenance/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaintenance: (id) => apiRequest(`/maintenance/${id}`, { method: 'DELETE' }),

  // ---- LOGS ----
  getLogs: () => apiRequest('/logs', { method: 'GET' }),
  createLog: (data) => apiRequest('/logs', { method: 'POST', body: JSON.stringify(data) })
};

export default API;
