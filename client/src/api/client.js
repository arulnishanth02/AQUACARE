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
    return {
      ...data.data,
      conversationId: data.conversationId,
      userMessage: data.userMessage,
      assistantMessage: data.assistantMessage
    };
  },

  async getChatHistory(pondId = 'pond-1', conversationId = null) {
    const query = new URLSearchParams();
    if (pondId) query.append('pondId', pondId);
    if (conversationId) query.append('conversationId', conversationId);

    const res = await fetch(`${API_BASE}/chat/history?${query.toString()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch chat history`);
    return await res.json();
  },

  async getConversation(conversationId) {
    const res = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(conversationId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch conversation`);
    return await res.json();
  },

  async clearChatHistory(conversationId) {
    const res = await fetch(`${API_BASE}/chat/history/${encodeURIComponent(conversationId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to clear chat history`);
    return await res.json();
  },

  async getAllPonds() {
    const res = await fetch(`${API_BASE}/pond/all`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch ponds`);
    return await res.json();
  },

  async getPond(pondId) {
    const res = await fetch(`${API_BASE}/pond/${encodeURIComponent(pondId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch pond details`);
    return await res.json();
  },

  async savePondReadings(payload) {
    const res = await fetch(`${API_BASE}/pond/readings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || `HTTP ${res.status}: Failed to save pond readings`);
    }
    return data;
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
  },

  async getFaqs(params = {}) {
    const query = new URLSearchParams();
    if (params.category) query.append('category', params.category);
    if (params.search) query.append('search', params.search);
    if (params.severity) query.append('severity', params.severity);

    const qs = query.toString();
    const res = await fetch(`${API_BASE}/knowledge/faqs${qs ? `?${qs}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch FAQs`);
    return await res.json();
  },

  async getFaqCategories() {
    const res = await fetch(`${API_BASE}/knowledge/faqs/categories`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to fetch FAQ categories`);
    return await res.json();
  },

  async getFaqDetail(faqId) {
    const res = await fetch(`${API_BASE}/knowledge/faqs/${encodeURIComponent(faqId)}`);
    if (!res.ok) {
      if (res.status === 404) {
        const notFoundErr = new Error(`FAQ "${faqId}" not found`);
        notFoundErr.status = 404;
        throw notFoundErr;
      }
      throw new Error(`HTTP ${res.status}: Failed to fetch FAQ details`);
    }
    return await res.json();
  }
};

