const API_BASE = '/api';

export const apiClient = {
  async getProviders() {
    const res = await fetch(`${API_BASE}/ai/providers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch providers`);
    return await res.json();
  },

  async getStatus() {
    const res = await fetch(`${API_BASE}/ai/status`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch AI status`);
    return await res.json();
  },

  async getModels() {
    const res = await fetch(`${API_BASE}/ai/models`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch models`);
    return await res.json();
  },

  async setProviderSettings(updates) {
    const res = await fetch(`${API_BASE}/ai/provider`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `Failed to update provider settings (HTTP ${res.status})`);
    }
    return data;
  },

  async testConnection(provider, options = {}) {
    const res = await fetch(`${API_BASE}/ai/test-connection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, ...options })
    });
    return await res.json();
  },

  async sendChatMessage(payload) {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      const err = new Error(data.error || 'Failed to process chat message');
      err.recoveryGuidance = data.recoveryGuidance;
      err.provider = data.provider;
      throw err;
    }
    return data.data;
  },

  async analyzePond(params) {
    const res = await fetch(`${API_BASE}/pond/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return await res.json();
  },

  async getPondHistory(pondId) {
    const res = await fetch(`${API_BASE}/pond/history?pondId=${encodeURIComponent(pondId || 'pond-1')}`);
    return await res.json();
  },

  async searchKnowledge(query) {
    const res = await fetch(`${API_BASE}/knowledge?query=${encodeURIComponent(query || '')}`);
    return await res.json();
  }
};

