import { geminiProvider } from './providers/geminiProvider.js';
import { ollamaProvider } from './providers/ollamaProvider.js';

/**
 * Health check manager for all AI providers
 */
export class ProviderHealthCheck {
  static async checkGemini(modelOverride) {
    return await geminiProvider.checkHealth(modelOverride);
  }

  static async checkOllama(modelOverride, baseUrlOverride) {
    return await ollamaProvider.checkHealth(modelOverride, baseUrlOverride);
  }

  static async checkAll(options = {}) {
    const { geminiModel, ollamaModel, ollamaBaseUrl } = options;

    const [geminiStatus, ollamaStatus] = await Promise.all([
      geminiProvider.checkHealth(geminiModel),
      ollamaProvider.checkHealth(ollamaModel, baseUrlOverrideSafe(ollamaBaseUrl))
    ]);

    return {
      gemini: geminiStatus,
      ollama: ollamaStatus,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Run a connection test for a specific provider
   */
  static async testConnection(provider, options = {}) {
    if (provider === 'gemini') {
      return await geminiProvider.checkHealth(options.model);
    }
    if (provider === 'ollama') {
      return await ollamaProvider.checkHealth(options.model, baseUrlOverrideSafe(options.baseUrl));
    }
    throw new Error(`Unknown provider "${provider}". Expected "gemini" or "ollama".`);
  }
}

function baseUrlOverrideSafe(url) {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (['127.0.0.1', 'localhost', '::1'].includes(parsed.hostname)) {
      return url;
    }
  } catch {}
  return undefined;
}

