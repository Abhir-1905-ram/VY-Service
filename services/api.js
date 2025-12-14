import { Platform } from 'react-native';
import Constants from 'expo-constants';

// API Base URL Configuration
// Use Railway production URL or fallback to localhost for development
const getApiBaseUrl = () => {
  // Check for environment variable first (for production)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Production Railway URL
  const PRODUCTION_API_URL = 'https://vy-service-production.up.railway.app/api';
  
  // For development, use localhost
  const resolveHost = () => {
    try {
      // Newer Expo
      const hostUri =
        Constants?.expoConfig?.hostUri ||
        // Older Expo
        Constants?.manifest?.debuggerHost ||
        // Fallback for some environments
        Constants?.manifest2?.extra?.expoClient?.hostUri;
      if (hostUri) {
        const host = hostUri.split(':')[0];
        if (host) return host;
      }
    } catch (e) {
      // ignore
    }
    // Fallbacks
    return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
  };
  
  // Use production URL by default, or localhost if explicitly in development
  // You can change this to use localhost during development
  const USE_PRODUCTION = true; // Set to false to use localhost during development
  
  if (USE_PRODUCTION) {
    return PRODUCTION_API_URL;
  } else {
    return `http://${resolveHost()}:3001/api`;
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Generic fetch with retry/backoff to reduce timeouts
async function fetchJsonWithRetry(url, options = {}, { retries = 2, backoffMs = 600 } = {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const resp = await fetch(url, options);
      const text = await resp.text();
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }
      if (!resp.ok) {
        const msg = data?.message || `HTTP ${resp.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (e) {
      lastErr = e;
      if (i < retries) {
        await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
      }
    }
  }
  throw lastErr || new Error('Network error');
}

export const saveRepair = async (repairData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/repairs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(repairData),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message || 'Failed to save repair' };
    }
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const getRepairs = async () => {
  try {
    const url = `${API_BASE_URL}/repairs`;
    console.log('Fetching repairs from:', url);
    const data = await fetchJsonWithRetry(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }, { retries: 3, backoffMs: 700 });
    
    if (data) {
      // Ensure data is an array
      const repairsArray = Array.isArray(data.data) ? data.data : (Array.isArray(data) ? data : []);
      console.log('Repairs found:', repairsArray.length);
      return { success: true, data: repairsArray };
    } else {
      return { success: false, message: 'Failed to fetch repairs' };
    }
  } catch (error) {
    console.error('Fetch error:', error);
    return { success: false, message: error.message || 'Network error. Make sure backend server is running on port 3000.' };
  }
};

export const getRepairById = async (uniqueId) => {
  try {
    console.log('Fetching repair by ID:', uniqueId);
    console.log('API URL:', `${API_BASE_URL}/repairs/search/${uniqueId}`);
    const response = await fetch(`${API_BASE_URL}/repairs/search/${uniqueId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Get repair by ID response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      // Return both the repair data and history
      const repairData = data.data || data;
      const history = data.history || [repairData]; // Get all previous problems
      const totalEntries = data.totalEntries || history.length;
      
      console.log('Repair data:', repairData);
      console.log('History count:', history.length);
      console.log('Total entries:', totalEntries);
      
      return { 
        success: true, 
        data: repairData,
        history: history, // Return all previous problems
        totalEntries: totalEntries
      };
    } else {
      return { success: false, message: data.message || 'Repair not found' };
    }
  } catch (error) {
    console.error('Get repair by ID error:', error);
    return { success: false, message: error.message || 'Network error' };
  }
};

export const updateRepair = async (id, updateData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/repairs/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    const data = await response.json();
    
    if (response.ok) {
      return { success: true, data };
    } else {
      return { success: false, message: data.message || 'Failed to update repair' };
    }
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

// ---------- Auth & Employees ----------
export const login = async (username, password) => {
  try {
    // Hardcoded admin (no backend needed)
    if (username === 'admin' && password === 'admin@1152') {
      return { success: true, data: { role: 'admin', user: { username: 'admin' } } };
    }
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      const snippet = (text || '').slice(0, 140);
      return { success: false, message: `Unexpected response (${response.status}). ${snippet}` };
    }
    if (response.ok) {
      return { success: true, data };
    }
    return { success: false, message: data.message || 'Login failed' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const signup = async (username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      const snippet = (text || '').slice(0, 140);
      return { success: false, message: `Unexpected response (${response.status}). ${snippet}` };
    }
    if (response.ok) {
      return { success: true, data: data.data };
    }
    return { success: false, message: data.message || 'Signup failed' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const getEmployees = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data: data.data || [] };
    }
    return { success: false, message: data.message || 'Failed to fetch employees' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const approveEmployee = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${id}/approve`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data: data.data };
    }
    return { success: false, message: data.message || 'Failed to approve employee' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const updateEmployee = async (id, payload) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data: data.data };
    }
    return { success: false, message: data.message || 'Failed to update employee' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

export const deleteEmployee = async (id) => {
  try {
    const url = `${API_BASE_URL}/employees/${id}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const text = await response.text();
    let data;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      data = null;
    }
    if (response.ok && data) {
      return { success: true, data: data.data || {} };
    }
    // Try fallback endpoint using POST
    const fbResp = await fetch(`${API_BASE_URL}/employees/${id}/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const fbText = await fbResp.text();
    let fbData;
    try { fbData = fbText ? JSON.parse(fbText) : {}; } catch { fbData = null; }
    if (fbResp.ok && fbData) {
      return { success: true, data: fbData.data || {} };
    }
    const msg = (data && data.message) || (fbData && fbData.message) || `Failed to delete employee`;
    return { success: false, message: msg };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

// Get allowed cards for an employee
export const getEmployeeCards = async (employeeId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}/cards`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await response.json();
    if (response.ok) {
      return { success: true, data: data.data || { allowedCards: [] } };
    }
    return { success: false, message: data.message || 'Failed to fetch employee cards' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

// Update allowed cards for an employee
export const updateEmployeeCards = async (employeeId, allowedCards) => {
  try {
    const response = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ allowedCards }),
    });
    const data = await response.json();
    if (response.ok) {
      // Ensure allowedCards is included in the response data
      const responseData = data.data || {};
      // If allowedCards is not in response, use the one we sent (shouldn't happen, but fallback)
      if (!responseData.hasOwnProperty('allowedCards')) {
        responseData.allowedCards = Array.isArray(allowedCards) ? allowedCards : [];
      }
      return { success: true, data: responseData };
    }
    return { success: false, message: data.message || 'Failed to update employee cards' };
  } catch (error) {
    return { success: false, message: error.message || 'Network error' };
  }
};

// ---------- Attendance ----------
export const markAttendance = async (employeeId, currentIp, date, lat, lng, accuracy, employeeName) => {
  try {
    const resp = await fetch(`${API_BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, currentIp, date, lat, lng, accuracy, employeeName }),
    });
    const text = await resp.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (resp.ok) {
      return { success: true, data };
    }
    return { success: false, message: data?.message || `Error ${resp.status}` };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const checkAttendanceIp = async (ip, lat, lng) => {
  try {
    const qs = new URLSearchParams();
    if (ip) qs.append('ip', ip);
    if (typeof lat !== 'undefined') qs.append('lat', String(lat));
    if (typeof lng !== 'undefined') qs.append('lng', String(lng));
    const resp = await fetch(`${API_BASE_URL}/attendance/check?${qs.toString()}`);
    const text = await resp.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (resp.ok) return { success: true, data };
    return { success: false, message: data?.message || `Error ${resp.status}` };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const getAttendanceByMonth = async (employeeId, yyyyMm) => {
  try {
    const qs = new URLSearchParams();
    if (yyyyMm) qs.append('month', yyyyMm);
    const resp = await fetch(`${API_BASE_URL}/attendance/by-employee/${encodeURIComponent(employeeId)}?${qs.toString()}`);
    const text = await resp.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (resp.ok) return { success: true, data: data.data || [] };
    return { success: false, message: data?.message || `Error ${resp.status}` };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const adminSetAttendance = async (employeeId, date, present, employeeName) => {
  try {
    const resp = await fetch(`${API_BASE_URL}/attendance/admin/set`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeId, date, present, employeeName }),
    });
    const text = await resp.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (resp.ok) return { success: true, data };
    return { success: false, message: data?.message || `Error ${resp.status}` };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

export const getTodayPresentCount = async () => {
  try {
    const resp = await fetch(`${API_BASE_URL}/attendance/today-count`);
    const text = await resp.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = {}; }
    if (resp.ok) return { success: true, data: data.data || { count: 0 } };
    return { success: false, message: data?.message || `Error ${resp.status}` };
  } catch (e) {
    return { success: false, message: e.message || 'Network error' };
  }
};

