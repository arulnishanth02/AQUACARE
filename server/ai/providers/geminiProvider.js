import { aiConfig } from '../aiConfig.js';

/**
 * Google Gemini Provider Adapter
 * Implements the standard AquaCare AI provider interface.
 */
export class GeminiProvider {
  constructor(options = {}) {
    this.name = 'gemini';
    this.apiKey = options.apiKey || aiConfig.gemini.apiKey;
    this.defaultModel = options.defaultModel || aiConfig.gemini.defaultModel;
    this.apiBaseUrl = options.apiBaseUrl || aiConfig.gemini.apiBaseUrl;
    this.timeout = options.timeout || aiConfig.requestTimeout;
  }

  /**
   * Health check for Gemini API
   */
  async checkHealth(modelOverride) {
    if (!this.apiKey) {
      return {
        provider: 'gemini',
        status: 'disconnected',
        available: false,
        message: 'Gemini API key is not configured in backend environment.',
        latencyMs: 0
      };
    }

    const startTime = Date.now();
    const model = modelOverride || this.defaultModel;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const url = `${this.apiBaseUrl}/models/${model}:generateContent?key=${this.apiKey}`;
      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with the single word: "READY"' }]
          }
        ],
        generationConfig: {
          maxOutputTokens: 10,
          temperature: 0.1
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || `HTTP ${response.status} ${response.statusText}`;
        const isQuota = response.status === 429 || errorMsg.toLowerCase().includes('quota') || errorMsg.toLowerCase().includes('resource_exhausted');

        return {
          provider: 'gemini',
          status: isQuota ? 'quota_exhausted' : 'error',
          available: false,
          message: errorMsg,
          code: response.status,
          latencyMs
        };
      }

      return {
        provider: 'gemini',
        status: 'connected',
        available: true,
        model,
        message: 'Google Gemini API is connected and responding.',
        latencyMs
      };
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      const isTimeout = err.name === 'AbortError';

      return {
        provider: 'gemini',
        status: 'error',
        available: false,
        message: isTimeout ? 'Gemini connection timed out after 10s.' : `Network error: ${err.message}`,
        latencyMs
      };
    }
  }

  /**
   * Format common message history to Gemini API contents format
   */
  formatMessages(messages, systemPrompt) {
    const contents = [];

    for (const msg of messages) {
      let role = 'user';
      if (msg.role === 'assistant' || msg.role === 'model') {
        role = 'model';
      }

      contents.push({
        role,
        parts: [{ text: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content) }]
      });
    }

    return contents;
  }

  /**
   * Generate AI response using Gemini API
   */
  async generateResponse({
    messages = [],
    systemPrompt = '',
    tools = [],
    responseFormat = 'text',
    temperature = 0.4,
    model = null
  }) {
    if (!this.apiKey) {
      throw new Error('Gemini API key is not configured in backend.');
    }

    const selectedModel = model || this.defaultModel;
    const contents = this.formatMessages(messages, systemPrompt);

    const payload = {
      contents,
      generationConfig: {
        temperature: Math.max(0.0, Math.min(1.0, temperature)),
        maxOutputTokens: 2500
      }
    };

    if (systemPrompt) {
      payload.systemInstruction = {
        parts: [{ text: systemPrompt }]
      };
    }

    if (responseFormat === 'json') {
      payload.generationConfig.responseMimeType = 'application/json';
    }

    // Tools formatting if function calling is provided
    if (Array.isArray(tools) && tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: tools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters || { type: 'object', properties: {} }
          }))
        }
      ];
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const url = `${this.apiBaseUrl}/models/${selectedModel}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorJson = await res.json().catch(() => ({}));
        const errMsg = errorJson?.error?.message || `Gemini API error: HTTP ${res.status}`;
        const err = new Error(errMsg);
        err.statusCode = res.status;
        err.isQuota = res.status === 429 || errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('resource_exhausted');
        throw err;
      }

      const data = await res.json();
      const candidate = data?.candidates?.[0];

      if (!candidate) {
        throw new Error('No candidate response returned from Gemini.');
      }

      // Check for function/tool calls
      const toolCalls = [];
      let textResponse = '';

      if (candidate.content?.parts) {
        for (const part of candidate.content.parts) {
          if (part.text) {
            textResponse += part.text;
          }
          if (part.functionCall) {
            toolCalls.push({
              name: part.functionCall.name,
              arguments: part.functionCall.args || {}
            });
          }
        }
      }

      return {
        provider: 'gemini',
        model: selectedModel,
        response: textResponse.trim(),
        toolCalls,
        usage: {
          promptTokens: data?.usageMetadata?.promptTokenCount || 0,
          completionTokens: data?.usageMetadata?.candidatesTokenCount || 0,
          totalTokens: data?.usageMetadata?.totalTokenCount || 0
        },
        status: 'success'
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        const timeoutErr = new Error(`Gemini request timed out after ${this.timeout}ms`);
        timeoutErr.isTimeout = true;
        throw timeoutErr;
      }
      throw err;
    }
  }
}

export const geminiProvider = new GeminiProvider();

