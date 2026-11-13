import express from 'express';
import { aiProviderManager } from '../ai/aiProviderManager.js';
import { ProviderHealthCheck } from '../ai/providerHealthCheck.js';
import { ModelManager } from '../ai/modelManager.js';
import { settingsStore } from '../storage/settingsStore.js';
import { pondStore } from '../storage/pondStore.js';
import { conversationStore } from '../storage/conversationStore.js';
import { aquaCareAgent } from '../agent/aquaCareAgent.js';
import { analyzeWaterQuality, detectFishProblem, getPondHistory, getPondWaterQuality } from '../agent/tools.js';
import { ragEngine } from '../agent/ragEngine.js';
import { faqManager } from '../agent/faqManager.js';

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
 * GET /api/chat/history or /api/ai/chat/history
 * Retrieve stored conversation history
 */
const handleGetChatHistory = (req, res) => {
  try {
    const { pondId = 'pond-1', conversationId } = req.query;

    if (conversationId) {
      const conv = conversationStore.getConversation(conversationId);
      if (conv) {
        return res.json({ success: true, conversation: conv });
      }
    }

    // Get or create conversation for pond
    const conversation = conversationStore.getOrCreateConversation({
      conversationId: conversationId || `conv-${pondId}`,
      pondId
    });

    const allConversations = conversationStore.getConversations({ pondId });

    res.json({
      success: true,
      conversation,
      conversations: allConversations
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get('/chat/history', handleGetChatHistory);
router.get('/history', handleGetChatHistory);

/**
 * GET /api/chat/history/:conversationId
 */
const handleGetSingleConversation = (req, res) => {
  try {
    const { conversationId } = req.params;
    const conv = conversationStore.getConversation(conversationId);
    if (!conv) {
      return res.status(404).json({ success: false, error: `Conversation ${conversationId} not found` });
    }
    res.json({ success: true, conversation: conv });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get('/chat/history/:conversationId', handleGetSingleConversation);

/**
 * DELETE /api/chat/history/:conversationId
 * Clears messages for a conversation
 */
const handleClearConversation = (req, res) => {
  try {
    const { conversationId } = req.params;
    const cleared = conversationStore.clearMessages(conversationId);
    if (!cleared) {
      return res.status(404).json({ success: false, error: `Conversation ${conversationId} not found` });
    }
    res.json({
      success: true,
      message: 'Conversation history cleared successfully',
      conversation: conversationStore.getConversation(conversationId)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.delete('/chat/history/:conversationId', handleClearConversation);

/**
 * POST /api/chat or POST /api/chat/message
 * Process conversation using AquaCare AI Agent, persisting messages
 */
const handleChatMessage = async (req, res) => {
  try {
    const {
      message,
      conversationId,
      pondId = 'pond-1',
      species,
      fishSpecies,
      conversationHistory = [],
      forceProvider
    } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A message string is required.' });
    }

    const effectiveSpecies = species || fishSpecies || null;
    const effectiveConversationId = conversationId || `conv-${pondId}`;

    // Get or create conversation in persistent store
    const conversation = conversationStore.getOrCreateConversation({
      conversationId: effectiveConversationId,
      pondId,
      species: effectiveSpecies
    });

    // Update pond species if user changed it in chat
    if (effectiveSpecies) {
      pondStore.updatePond(pondId, { species: effectiveSpecies });
      conversationStore.updateConversation(conversation.id, { species: effectiveSpecies });
    }

    // Persist user message
    const savedUserMessage = conversationStore.addMessage(conversation.id, {
      role: 'user',
      content: message.trim()
    });

    // Determine history for agent (use provided history or saved messages prior to this user message)
    const historyForAgent = conversationHistory.length > 0
      ? conversationHistory
      : conversation.messages.slice(0, -1).map(m => ({ role: m.role, content: m.content }));

    // Run AI Agent
    const agentResponse = await aquaCareAgent.processUserMessage({
      message: message.trim(),
      conversationHistory: historyForAgent,
      pondId: conversation.pondId,
      speciesOverride: effectiveSpecies || conversation.species,
      forceProvider
    });

    // Persist AI assistant response
    const savedAssistantMessage = conversationStore.addMessage(conversation.id, {
      role: 'assistant',
      content: agentResponse.response,
      provider: agentResponse.provider,
      model: agentResponse.model,
      toolExecutions: agentResponse.toolExecutions || [],
      sources: agentResponse.sources || [],
      waterAnalysis: agentResponse.waterAnalysis || null,
      diseaseDiagnosis: agentResponse.diseaseDiagnosis || null,
      fallbackOccurred: agentResponse.fallbackOccurred || false,
      originalProvider: agentResponse.originalProvider || null
    });

    res.json({
      success: true,
      conversationId: conversation.id,
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage,
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
};
router.post('/chat', handleChatMessage);
router.post('/chat/message', handleChatMessage);

/**
 * Pond Management Endpoints
 */

// GET /api/pond/all
router.get('/pond/all', (req, res) => {
  try {
    const ponds = pondStore.getAllPonds();
    res.json({ success: true, ponds });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/pond/:pondId
router.get('/pond/:pondId', (req, res) => {
  try {
    const { pondId } = req.params;
    const pond = pondStore.getPond(pondId);
    if (!pond) {
      return res.status(404).json({ success: false, error: `Pond ${pondId} not found` });
    }
    const latestWaterQuality = pondStore.getLatestWaterQuality(pondId);
    res.json({ success: true, pond, latestWaterQuality });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/pond/readings - Store readings from Water Quality Lab
router.post('/pond/readings', (req, res) => {
  try {
    const { pondId = 'pond-1', species, ph, dissolvedOxygen, ammonia, nitrite, temperature, source = 'Water Quality Lab' } = req.body;
    const savedRecord = pondStore.saveWaterQualityReading(pondId, {
      species,
      ph,
      dissolvedOxygen,
      ammonia,
      nitrite,
      temperature,
      source
    });

    const analysis = analyzeWaterQuality({
      species: savedRecord.species,
      ph: savedRecord.ph,
      dissolvedOxygen: savedRecord.dissolvedOxygen,
      ammonia: savedRecord.ammonia,
      nitrite: savedRecord.nitrite,
      temperature: savedRecord.temperature
    });

    res.json({
      success: true,
      savedRecord,
      analysis
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/pond/analyze
 * Deterministic water quality analysis, automatically persisting to pondStore
 */
router.post('/pond/analyze', (req, res) => {
  try {
    const { save = true, pondId = 'pond-1', ...params } = req.body;
    const result = analyzeWaterQuality(params);

    let savedRecord = null;
    if (save && pondId) {
      savedRecord = pondStore.saveWaterQualityReading(pondId, {
        ...params,
        source: 'Water Quality Lab'
      });
    }

    res.json({ success: true, result, savedRecord });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/pond/history
 */
router.get('/pond/history', (req, res) => {
  try {
    const { pondId = 'pond-1' } = req.query;
    const history = getPondHistory({ pondId });
    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * FAQ & Knowledge Base Endpoints
 */
const handleFaqCategories = (req, res) => {
  try {
    const data = faqManager.getCategories();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get('/knowledge/faqs/categories', handleFaqCategories);
router.get('/faqs/categories', handleFaqCategories);

const handleFaqsList = (req, res) => {
  try {
    const { category, search, severity } = req.query;
    const faqs = faqManager.getFaqs({ category, search, severity });
    res.json({
      success: true,
      total: faqs.length,
      faqs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get('/knowledge/faqs', handleFaqsList);
router.get('/faqs', handleFaqsList);

const handleFaqDetail = (req, res) => {
  try {
    const { faqId } = req.params;
    const faq = faqManager.getFaqById(faqId);
    if (!faq) {
      return res.status(404).json({
        success: false,
        error: `FAQ with id "${faqId}" was not found.`
      });
    }
    res.json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
router.get('/knowledge/faqs/:faqId', handleFaqDetail);
router.get('/faqs/:faqId', handleFaqDetail);

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
