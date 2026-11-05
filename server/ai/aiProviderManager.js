import { geminiProvider } from './providers/geminiProvider.js';
import { ollamaProvider } from './providers/ollamaProvider.js';
import { ProviderHealthCheck } from './providerHealthCheck.js';
import { settingsStore } from '../storage/settingsStore.js';

/**
 * AI Provider Manager
 * Centralizes provider selection, mode switching, health monitoring, and resilient automatic fallback.
 */
export class AIProviderManager {
  constructor() {
    this.gemini = geminiProvider;
    this.ollama = ollamaProvider;
  }

  /**
   * Current configured mode ('auto' | 'gemini' | 'ollama')
   */
  getMode() {
    return settingsStore.getSettings().providerMode || 'auto';
  }

  /**
   * Set provider mode
   */
  setProviderMode(mode) {
    return settingsStore.updateSettings({ providerMode: mode });
  }

  /**
   * Comprehensive availability check of both providers
   */
  async checkProviderAvailability() {
    const settings = settingsStore.getSettings();
    const health = await ProviderHealthCheck.checkAll({
      geminiModel: settings.geminiModel,
      ollamaModel: settings.ollamaModel,
      ollamaBaseUrl: settings.ollamaBaseUrl
    });

    const mode = this.getMode();
    let activeProvider = null;
    let effectiveModel = null;
    let statusMessage = '';

    if (mode === 'gemini') {
      activeProvider = 'gemini';
      effectiveModel = settings.geminiModel;
      statusMessage = health.gemini.available
        ? `Gemini mode active (${settings.geminiModel})`
        : `Gemini unavailable: ${health.gemini.message}`;
    } else if (mode === 'ollama') {
      activeProvider = 'ollama';
      effectiveModel = settings.ollamaModel;
      statusMessage = health.ollama.available
        ? `Ollama local mode active (${settings.ollamaModel})`
        : `Ollama unavailable: ${health.ollama.message}`;
    } else {
      // Auto mode
      if (health.gemini.available) {
        activeProvider = 'gemini';
        effectiveModel = settings.geminiModel;
        statusMessage = `Automatic mode: Using Google Gemini (${settings.geminiModel})`;
      } else if (health.ollama.available) {
        activeProvider = 'ollama';
        effectiveModel = settings.ollamaModel;
        statusMessage = `Automatic mode: Gemini unavailable, using Ollama (${settings.ollamaModel})`;
      } else {
        activeProvider = null;
        effectiveModel = null;
        statusMessage = 'Both Gemini and Ollama providers are currently unavailable.';
      }
    }

    return {
      mode,
      activeProvider,
      effectiveModel,
      statusMessage,
      health,
      gemini: {
        configured: Boolean(this.gemini.apiKey),
        available: health.gemini.available,
        model: settings.geminiModel,
        status: health.gemini.status,
        message: health.gemini.message,
        latencyMs: health.gemini.latencyMs
      },
      ollama: {
        baseUrl: settings.ollamaBaseUrl,
        available: health.ollama.available,
        model: settings.ollamaModel,
        status: health.ollama.status,
        message: health.ollama.message,
        installedModels: health.ollama.installedModels || [],
        latencyMs: health.ollama.latencyMs
      }
    };
  }

  /**
   * Resolves the primary and fallback provider based on configured mode and health
   */
  async resolveExecutionProviders() {
    const mode = this.getMode();
    const settings = settingsStore.getSettings();

    if (mode === 'gemini') {
      return {
        primary: { provider: 'gemini', model: settings.geminiModel },
        fallback: null
      };
    }

    if (mode === 'ollama') {
      return {
        primary: { provider: 'ollama', model: settings.ollamaModel, baseUrl: settings.ollamaBaseUrl },
        fallback: null
      };
    }

    // Auto Mode: check health to determine primary preference
    const health = await ProviderHealthCheck.checkAll({
      geminiModel: settings.geminiModel,
      ollamaModel: settings.ollamaModel,
      ollamaBaseUrl: settings.ollamaBaseUrl
    });

    if (health.gemini.available) {
      return {
        primary: { provider: 'gemini', model: settings.geminiModel },
        fallback: health.ollama.available
          ? { provider: 'ollama', model: settings.ollamaModel, baseUrl: settings.ollamaBaseUrl }
          : null
      };
    }

    if (health.ollama.available) {
      return {
        primary: { provider: 'ollama', model: settings.ollamaModel, baseUrl: settings.ollamaBaseUrl },
        fallback: null
      };
    }

    // Neither is confirmed available upfront; default primary to Gemini with Ollama fallback
    return {
      primary: { provider: 'gemini', model: settings.geminiModel },
      fallback: { provider: 'ollama', model: settings.ollamaModel, baseUrl: settings.ollamaBaseUrl }
    };
  }

  /**
   * Central generation entrypoint with resilient fallback
   */
  async generateAIResponse({
    messages = [],
    systemPrompt = '',
    tools = [],
    responseFormat = 'text',
    temperature = 0.4,
    forceProvider = null
  }) {
    const mode = this.getMode();
    const settings = settingsStore.getSettings();

    let primaryConfig;
    let fallbackConfig;

    if (forceProvider === 'gemini') {
      primaryConfig = { provider: 'gemini', model: settings.geminiModel };
      fallbackConfig = null;
    } else if (forceProvider === 'ollama') {
      primaryConfig = { provider: 'ollama', model: settings.ollamaModel, baseUrl: settings.ollamaBaseUrl };
      fallbackConfig = null;
    } else {
      const resolved = await this.resolveExecutionProviders();
      primaryConfig = resolved.primary;
      fallbackConfig = resolved.fallback;
    }

    // Attempt Primary Provider
    try {
      const result = await this.executeProvider(primaryConfig, {
        messages,
        systemPrompt,
        tools,
        responseFormat,
        temperature
      });

      return {
        ...result,
        fallbackOccurred: false,
        activeMode: mode
      };
    } catch (primaryError) {
      console.warn(`Primary provider (${primaryConfig.provider}) failed:`, primaryError.message);

      // Check if fallback is allowed and available
      const shouldAttemptFallback = fallbackConfig && this.isRetriableError(primaryError);

      if (!shouldAttemptFallback) {
        // Build helpful user recovery advice
        const recoveryGuidance = this.buildErrorRecoveryAdvice(primaryConfig.provider, primaryError);
        const enhancedError = new Error(`${primaryError.message}\n${recoveryGuidance}`);
        enhancedError.originalError = primaryError;
        enhancedError.provider = primaryConfig.provider;
        throw enhancedError;
      }

      console.info(`Triggering automatic fallback from ${primaryConfig.provider} to ${fallbackConfig.provider}...`);

      try {
        const fallbackResult = await this.executeProvider(fallbackConfig, {
          messages,
          systemPrompt,
          tools,
          responseFormat,
          temperature
        });

        return {
          ...fallbackResult,
          fallbackOccurred: true,
          originalProvider: primaryConfig.provider,
          fallbackReason: primaryError.message,
          activeMode: mode
        };
      } catch (fallbackError) {
        console.error(`Fallback provider (${fallbackConfig.provider}) also failed:`, fallbackError.message);
        const combinedMessage = `Both AI providers failed. Primary (${primaryConfig.provider}): ${primaryError.message}. Fallback (${fallbackConfig.provider}): ${fallbackError.message}`;
        const finalError = new Error(combinedMessage);
        finalError.recoveryGuidance = 'Please verify your internet connection for Gemini or start Ollama using `ollama serve`.';
        throw finalError;
      }
    }
  }

  /**
   * Execute single provider request
   */
  async executeProvider(config, params) {
    if (config.provider === 'gemini') {
      return await this.gemini.generateResponse({
        ...params,
        model: config.model
      });
    }

    if (config.provider === 'ollama') {
      return await this.ollama.generateResponse({
        ...params,
        model: config.model,
        baseUrl: config.baseUrl
      });
    }

    throw new Error(`Unsupported provider: "${config.provider}"`);
  }

  /**
   * Determine whether an error warrants trying the fallback provider
   */
  isRetriableError(err) {
    if (!err) return false;
    if (err.isTimeout) return true;
    if (err.isQuota) return true;
    if (err.statusCode && (err.statusCode >= 500 || err.statusCode === 429 || err.statusCode === 408)) return true;

    const msg = (err.message || '').toLowerCase();
    const retriableKeywords = [
      'network', 'fetch failed', 'econnrefused', 'etimedout', 'enotfound',
      'socket', 'abort', '503', '502', '500', '429', 'quota', 'resource_exhausted',
      'rate limit', 'demand', 'overloaded', 'capacity', 'temporarily',
      'unavailable', 'service', 'internal', 'timeout'
    ];

    return retriableKeywords.some(keyword => msg.includes(keyword));
  }

  /**
   * Informative error message generator
   */
  buildErrorRecoveryAdvice(provider, error) {
    if (provider === 'gemini') {
      if (error.isQuota || (error.message || '').toLowerCase().includes('quota')) {
        return 'Gemini API quota is currently exhausted. Switch to "Automatic" or "Ollama Local" mode in AI Settings, or supply a new GEMINI_API_KEY.';
      }
      return 'Check that your internet connection is active and GEMINI_API_KEY is configured in backend environment.';
    }

    if (provider === 'ollama') {
      return 'Make sure Ollama is running locally (run `ollama serve` in terminal) and the model is downloaded (run `ollama pull qwen2.5:7b`).';
    }

    return 'Check AI Provider Settings to restore connectivity.';
  }
}

export const aiProviderManager = new AIProviderManager();
