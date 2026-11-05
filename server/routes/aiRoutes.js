import express from 'express';
import { aiProviderManager } from '../ai/aiProviderManager.js';
import { ProviderHealthCheck } from '../ai/providerHealthCheck.js';
import { ModelManager } from '../ai/modelManager.js';
import { settingsStore } from '../storage/settingsStore.js';
import { aquaCareAgent } from '../agent/aquaCareAgent.js';
import { analyzeWaterQuality, detectFishProblem, getPondHistory } from '../agent/tools.js';
import { ragEngine } from '../agent/ragEngine.js';

const router = express.Router();

/**
 * GET /api/ai/providers
 * Returns available providers and their configuration status (no secrets exposed)
 */
router.get('/providers', async (req, res) => {
  try {
    const settings = settingsStore.getPublicSettings();
    const availability = await aiProviderManager.checkProviderAvailability();

    res.json({
      success: true,
      settings,
      providers: {
        gemini: {
          name: 'Google Gemini (Cloud AI)',
          configured: availability.gemini.configured,
          status: availability.gemini.status,
          currentModel: settings.geminiModel,
          available: availability.gemini.available,
          latencyMs: availability.gemini.latencyMs
        },
        ollama: {
          name: 'Ollama (Local AI)',
          configured: true,
          status: availability.ollama.status,
          currentModel: settings.ollamaModel,
          baseUrl: settings.ollamaBaseUrl,
          available: availability.ollama.available,
          installedModels: availability.ollama.installedModels,
          latencyMs: availability.ollama.latencyMs
        }
      },
      activeMode: settings.providerMode,
      activeProvider: availability.activeProvider,
      effectiveModel: availability.effectiveModel
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ai/status
 * Returns active provider and real-time health information
 */
router.get('/status', async (req, res) => {
  try {
    const availability = await aiProviderManager.checkProviderAvailability();
    res.json({
      success: true,
      activeMode: availability.mode,
      activeProvider: availability.activeProvider,
      effectiveModel: availability.effectiveModel,
      statusMessage: availability.statusMessage,
      health: availability.health,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/ai/models
 * Retrieves available Gemini and Ollama model options
 */
router.get('/models', async (req, res) => {
  try {
    const settings = settingsStore.getSettings();
    const models = await ModelManager.getAllModels(settings.ollamaBaseUrl);
    res.json({
      success: true,
      models
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/provider
 * Change the provider mode ('auto' | 'gemini' | 'ollama') and model settings
 */
router.post('/provider', async (req, res) => {
  try {
    const { mode, geminiModel, ollamaModel, ollamaBaseUrl } = req.body;

    const updates = {};
    if (mode && ['auto', 'gemini', 'ollama'].includes(mode)) {
      updates.providerMode = mode;
    }
    if (geminiModel) updates.geminiModel = String(geminiModel).trim();
    if (ollamaModel) updates.ollamaModel = String(ollamaModel).trim();
    if (ollamaBaseUrl) updates.ollamaBaseUrl = String(ollamaBaseUrl).trim();

    const updatedSettings = settingsStore.updateSettings(updates);
    const availability = await aiProviderManager.checkProviderAvailability();

    res.json({
      success: true,
      message: `AI provider mode updated to ${updatedSettings.providerMode}`,
      settings: updatedSettings,
      activeProvider: availability.activeProvider,
      effectiveModel: availability.effectiveModel
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/ai/test-connection
 * Test connection to a selected provider
 */
router.post('/test-connection', async (req, res) => {
  try {
    const { provider, model, baseUrl } = req.body;
    if (!provider || !['gemini', 'ollama'].includes(provider)) {
      return res.status(400).json({ success: false, error: 'Provider must be "gemini" or "ollama".' });
    }

    const testResult = await ProviderHealthCheck.testConnection(provider, { model, baseUrl });
    res.json({
      success: testResult.available,
      testResult
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/chat
 * Process conversation using AquaCare AI Agent and the active provider
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], pondId = 'pond-1', species, forceProvider } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A message string is required.' });
    }

    const agentResponse = await aquaCareAgent.processUserMessage({
      message: message.trim(),
      conversationHistory,
      pondId,
      speciesOverride: species,
      forceProvider
    });

    res.json({
      success: true,
      data: agentResponse
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Internal AI processing error',
      recoveryGuidance: err.recoveryGuidance || 'Verify provider configuration in AI Settings.',
      provider: err.provider || 'unknown'
    });
  }
});

/**
 * POST /api/pond/analyze
 * Direct deterministic water quality analysis
 */
router.post('/pond/analyze', (req, res) => {
  try {
    const result = analyzeWaterQuality(req.body);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pond/history
 */
router.get('/pond/history', (req, res) => {
  try {
    const { pondId } = req.query;
    const history = getPondHistory({ pondId });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/knowledge
 */
router.get('/knowledge', (req, res) => {
  try {
    const { query } = req.query;
    const results = ragEngine.search(query || '', { limit: 10 });
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;

