// CityPulse Unified API Client
// Connects the frontend to FastAPI civic backend & Gemini Multimodal AI Engine

const API = {
  // Auto-detect base URL: If running on port 3000 (legacy dev server), target backend on 8000;
  // otherwise use relative path so it seamlessly works on Render, Railway, HuggingFace, etc.
  baseUrl: (window.location.port === '3000' && window.location.hostname === 'localhost') 
    ? 'http://localhost:8000' 
    : '',

  STORAGE_TOKEN_KEY: 'citypulse_auth_token',

  getToken() {
    try {
      return localStorage.getItem(this.STORAGE_TOKEN_KEY) || (window.AppState && AppState.token) || null;
    } catch (e) {
      return null;
    }
  },

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(this.STORAGE_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(this.STORAGE_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Could not persist token to localStorage', e);
    }
    if (window.AppState) {
      AppState.token = token;
    }
  },

  clearToken() {
    this.setToken(null);
  },

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = options.headers || {};

    const token = this.getToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // If body is NOT FormData and not already typed, default to JSON
    if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(url, config);
      
      let data = null;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch (_) {
          data = { message: text };
        }
      }

      if (!response.ok) {
        const errorDetail = data && (data.detail || data.message || response.statusText);
        const err = new Error(typeof errorDetail === 'string' ? errorDetail : JSON.stringify(errorDetail));
        err.status = response.status;
        err.data = data;
        throw err;
      }

      return data;
    } catch (error) {
      console.error(`[API Error] ${options.method || 'GET'} ${endpoint}:`, error);
      throw error;
    }
  },

  // -------------------------------------------------------------
  // Authentication Endpoints
  // -------------------------------------------------------------
  async login(email, password) {
    const res = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (res && res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  },

  async register(userData) {
    const res = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (res && res.access_token) {
      this.setToken(res.access_token);
    }
    return res;
  },

  async getMe() {
    return await this.request('/api/auth/me', { method: 'GET' });
  },

  // -------------------------------------------------------------
  // AI Grievance Ingestion & Analysis
  // -------------------------------------------------------------
  async analyzeComplaint(description, imageBase64 = null) {
    return await this.request('/api/ai/analyze-complaint', {
      method: 'POST',
      body: JSON.stringify({
        description,
        image_base64: imageBase64
      })
    });
  },

  async submitComplaint(formData) {
    // formData is an instance of FormData containing title, description, category,
    // priority, assigned_department, ai_summary, suggested_next_action, latitude,
    // longitude, address, locality, ward, images (files).
    return await this.request('/api/complaints', {
      method: 'POST',
      body: formData
    });
  },

  async getComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.locality && params.locality !== 'all') query.set('locality', params.locality);
    if (params.my_only) query.set('my_only', 'true');

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this.request(`/api/complaints${qs}`, { method: 'GET' });
  },

  async getComplaintById(id) {
    return await this.request(`/api/complaints/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  async supportComplaint(id) {
    return await this.request(`/api/complaints/${encodeURIComponent(id)}/support`, { method: 'POST' });
  },

  async disputeResolution(id, confirmed, disputeReason = '') {
    return await this.request(`/api/complaints/${encodeURIComponent(id)}/dispute`, {
      method: 'POST',
      body: JSON.stringify({
        confirmed,
        dispute_reason: disputeReason
      })
    });
  },

  async getDuplicates(id) {
    return await this.request(`/api/complaints/${encodeURIComponent(id)}/duplicates`, { method: 'GET' });
  },

  // -------------------------------------------------------------
  // Administrator Dashboard Endpoints
  // -------------------------------------------------------------
  async getAdminComplaints(params = {}) {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'all') query.set('status', params.status);
    if (params.category && params.category !== 'all') query.set('category', params.category);
    if (params.severity && params.severity !== 'all') query.set('severity', params.severity);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return await this.request(`/api/admin/complaints${qs}`, { method: 'GET' });
  },

  async updateComplaintStatus(id, newStatus, notes = '', assignedDepartment = null) {
    const body = {
      status: newStatus,
      notes: notes || `Status changed to ${newStatus}`
    };
    if (assignedDepartment) {
      body.assigned_department = assignedDepartment;
    }
    return await this.request(`/api/admin/complaints/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  async overrideSeverity(id, severity, reason) {
    return await this.request(`/api/admin/complaints/${encodeURIComponent(id)}/override-severity`, {
      method: 'POST',
      body: JSON.stringify({ severity, reason })
    });
  },

  async resolveComplaintWithPhoto(id, photoFile, notes = '') {
    const formData = new FormData();
    formData.append('notes', notes);
    formData.append('resolution_photo', photoFile);

    return await this.request(`/api/admin/complaints/${encodeURIComponent(id)}/resolve`, {
      method: 'POST',
      body: formData
    });
  },

  async triggerAutonomousTriage(id) {
    return await this.request(`/api/admin/complaints/${encodeURIComponent(id)}/triage`, {
      method: 'POST'
    });
  },

  async mergeIncidents(parentId, duplicateIds, notes = '') {
    return await this.request('/api/admin/incidents/merge', {
      method: 'POST',
      body: JSON.stringify({
        parent_complaint_id: parentId,
        duplicate_complaint_ids: duplicateIds,
        notes
      })
    });
  },

  async getAuditLogs() {
    return await this.request('/api/admin/audit-logs', { method: 'GET' });
  },

  // -------------------------------------------------------------
  // Analytics & Civic Intelligence
  // -------------------------------------------------------------
  async getAnalyticsOverview() {
    return await this.request('/api/analytics/overview', { method: 'GET' });
  },

  async getMapIncidents() {
    return await this.request('/api/analytics/map-incidents', { method: 'GET' });
  },

  async getHotspots() {
    return await this.request('/api/analytics/hotspots', { method: 'GET' });
  },

  async getCivicGuidelines() {
    return await this.request('/api/analytics/guidelines', { method: 'GET' });
  },

  // -------------------------------------------------------------
  // Conversational AI Assistant
  // -------------------------------------------------------------
  async chatWithAssistant(message, latitude = null, longitude = null, locality = null) {
    return await this.request('/api/assistant/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        latitude,
        longitude,
        locality
      })
    });
  }
};

window.API = API;
