import { aiConfig } from '../aiConfig.js';

/**
 * Ollama Provider Adapter
 * Implements the standard AquaCare AI provider interface for local LLMs.
 */
export class OllamaProvider {
  constructor(options = {}) {
    this.name = 'ollama';
    this.baseUrl = options.baseUrl || aiConfig.ollama.baseUrl;
    this.defaultModel = options.defaultModel || aiConfig.ollama.defaultModel;
    this.timeout = options.timeout || aiConfig.requestTimeout;
  }

  /**
   * Validate that the host is permitted (security check)
   */
  validateHost(url) {
    try {
      const parsed = new URL(url);
      const isAllowed = aiConfig.ollama.allowedHosts.some(host =>
        parsed.hostname === host || parsed.hostname.endsWith(`.${host}`)
      );
      return isAllowed;
    } catch {
      return false;
    }
  }

  /**
   * Health check for Ollama local service
   */
  async checkHealth(modelOverride, baseUrlOverride) {
    const targetUrl = (baseUrlOverride || this.baseUrl).replace(/\/+$/, '');
    const startTime = Date.now();

    if (!this.validateHost(targetUrl)) {
      return {
        provider: 'ollama',
        status: 'error',
        available: false,
        message: 'Invalid or unauthorized Ollama host URL.',
        latencyMs: 0
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      // Check version / tags endpoint
      const versionRes = await fetch(`${targetUrl}/api/version`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!versionRes.ok) {
        return {
          provider: 'ollama',
          status: 'error',
          available: false,
          message: `Ollama returned HTTP ${versionRes.status}`,
          latencyMs: Date.now() - startTime
        };
      }

      const versionData = await versionRes.json().catch(() => ({ version: 'unknown' }));

      // Fetch installed models to check if the chosen model exists
      const modelsRes = await fetch(`${targetUrl}/api/tags`);
      const modelsData = await modelsRes.json().catch(() => ({ models: [] }));
      const installedModels = (modelsData.models || []).map(m => m.name);

      const targetModel = modelOverride || this.defaultModel;
      const modelInstalled = installedModels.some(m =>
        m === targetModel || m.startsWith(`${targetModel}:`) || targetModel.startsWith(`${m}:`)
      );

      const latencyMs = Date.now() - startTime;

      if (!modelInstalled && installedModels.length > 0) {
        return {
          provider: 'ollama',
          status: 'model_missing',
          available: false,
          version: versionData.version,
          installedModels,
          selectedModel: targetModel,
          message: `Ollama is running (v${versionData.version}), but model "${targetModel}" is not installed. You have: [${installedModels.join(', ')}]. Run: ollama run ${targetModel}`,
          latencyMs
        };
      }

      if (installedModels.length === 0) {
        return {
          provider: 'ollama',
          status: 'no_models',
          available: false,
          version: versionData.version,
          installedModels: [],
          message: `Ollama is running (v${versionData.version}), but no models are installed yet. Run: ollama pull qwen2.5:7b or ollama pull llama3.2`,
          latencyMs
        };
      }

      return {
        provider: 'ollama',
        status: 'connected',
        available: true,
        version: versionData.version,
        model: targetModel,
        installedModels,
        message: `Ollama local AI is active (v${versionData.version}) with model "${targetModel}".`,
        latencyMs
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError';

      return {
        provider: 'ollama',
        status: 'disconnected',
        available: false,
        message: isTimeout
          ? 'Ollama connection timed out. Ensure Ollama service is running on 127.0.0.1:11434.'
          : 'Ollama is offline or unreachable. Start it with command: ollama serve',
        latencyMs
      };
    }
  }

  /**
   * List installed models in Ollama
   */
  async listModels(baseUrlOverride) {
    const targetUrl = (baseUrlOverride || this.baseUrl).replace(/\/+$/, '');
    try {
      const res = await fetch(`${targetUrl}/api/tags`);
      if (!res.ok) return [];
      const data = await res.json();
      return (data.models || []).map(m => ({
        id: m.name,
        name: m.name,
        size: m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(2)} GB` : undefined,
        modifiedAt: m.modified_at
      }));
    } catch {
      return [];
    }
  }

  /**
   * Format messages for Ollama chat API
   */
  formatMessages(messages, systemPrompt) {
    const formatted = [];

    if (systemPrompt) {
      formatted.push({
        role: 'system',
        content: systemPrompt
      });
    }

    for (const msg of messages) {
      formatted.push({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
      });
    }

    return formatted;
  }

  /**
   * Generate AI response using Ollama API
   */
  async generateResponse({
    messages = [],
    systemPrompt = '',
    tools = [],
    responseFormat = 'text',
    temperature = 0.4,
    model = null,
    baseUrl = null
  }) {
    const targetUrl = (baseUrl || this.baseUrl).replace(/\/+$/, '');
    const selectedModel = model || this.defaultModel;

    const formattedMessages = this.formatMessages(messages, systemPrompt);

    const payload = {
      model: selectedModel,
      messages: formattedMessages,
      stream: false,
      options: {
        temperature: Math.max(0.0, Math.min(1.0, temperature))
      }
    };

    if (responseFormat === 'json') {
      payload.format = 'json';
    }

    // Pass tools if provided
    if (Array.isArray(tools) && tools.length > 0) {
      payload.tools = tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters || { type: 'object', properties: {} }
        }
      }));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const res = await fetch(`${targetUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        const err = new Error(`Ollama API error (HTTP ${res.status}): ${errorText}`);
        err.statusCode = res.status;
        throw err;
      }

      const data = await res.json();
      const message = data?.message || {};

      const toolCalls = [];
      if (Array.isArray(message.tool_calls)) {
        for (const tc of message.tool_calls) {
          toolCalls.push({
            name: tc.function?.name,
            arguments: tc.function?.arguments || {}
          });
        }
      }

      return {
        provider: 'ollama',
        model: selectedModel,
        response: (message.content || '').trim(),
        toolCalls,
        usage: {
          promptTokens: data?.prompt_eval_count || 0,
          completionTokens: data?.eval_count || 0,
          totalDurationMs: data?.total_duration ? Math.round(data.total_duration / 1000000) : 0
        },
        status: 'success'
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Ollama request timed out after ${this.timeout}ms`);
        timeoutErr.isTimeout = true;
        throw timeoutErr;
      }
      throw err;
    }
  }
}

export const ollamaProvider = new OllamaProvider();

