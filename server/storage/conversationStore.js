import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONVERSATIONS_FILE = path.resolve(__dirname, 'chat_conversations.json');

class ConversationStore {
  constructor() {
    this.conversations = {};
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(CONVERSATIONS_FILE)) {
        const raw = fs.readFileSync(CONVERSATIONS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          this.conversations = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read chat conversations file, initializing empty store:', err.message);
    }
    this.conversations = {};
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(this.conversations, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist chat conversations:', err.message);
    }
  }

  /**
   * List conversations, optionally filtered by pondId
   */
  getConversations(filter = {}) {
    const list = Object.values(this.conversations);
    if (filter.pondId) {
      return list.filter(c => c.pondId === filter.pondId);
    }
    return list.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }

  /**
   * Get conversation by ID
   */
  getConversation(conversationId) {
    if (!conversationId) return null;
    return this.conversations[conversationId] || null;
  }

  /**
   * Get or create a conversation for a pond
   */
  getOrCreateConversation({ conversationId, pondId = 'pond-1', species = 'tilapia', title = 'Pond Doctor Consultation' }) {
    const cid = conversationId || `conv-${pondId}`;
    if (this.conversations[cid]) {
      // If species or pondId is updated, update conversation metadata
      if (species && this.conversations[cid].species !== species) {
        this.conversations[cid].species = species.toLowerCase();
        this.conversations[cid].updatedAt = new Date().toISOString();
        this.save();
      }
      return this.conversations[cid];
    }

    const newConversation = {
      id: cid,
      pondId,
      species: (species || 'tilapia').toLowerCase(),
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}-welcome`,
          role: 'assistant',
          content: 'Welcome to AquaCare! I am your AI Pond Doctor. You can share water readings (pH, DO, Ammonia, Nitrite, Temperature) or describe fish symptoms. All water quality thresholds are deterministically verified against certified aquaculture standards.',
          provider: 'system',
          model: 'aquacare-engine',
          timestamp: new Date().toLocaleTimeString(),
          sources: ['AquaCare Aquaculture Compendium', 'FAO Small-Scale Aquaculture Guidelines']
        }
      ]
    };

    this.conversations[cid] = newConversation;
    this.save();
    return newConversation;
  }

  /**
   * Append a message to a conversation
   */
  addMessage(conversationId, messageObj) {
    let conv = this.conversations[conversationId];
    if (!conv) {
      conv = this.getOrCreateConversation({ conversationId });
    }

    const messageId = messageObj.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const formattedMessage = {
      id: messageId,
      role: messageObj.role || 'user',
      content: messageObj.content || '',
      provider: messageObj.provider || null,
      model: messageObj.model || null,
      timestamp: messageObj.timestamp || new Date().toLocaleTimeString(),
      toolExecutions: messageObj.toolExecutions || [],
      sources: messageObj.sources || [],
      waterAnalysis: messageObj.waterAnalysis || null,
      diseaseDiagnosis: messageObj.diseaseDiagnosis || null,
      fallbackOccurred: Boolean(messageObj.fallbackOccurred),
      originalProvider: messageObj.originalProvider || null
    };

    conv.messages.push(formattedMessage);
    conv.updatedAt = new Date().toISOString();
    this.save();

    return formattedMessage;
  }

  /**
   * Update conversation metadata (e.g. species or title)
   */
  updateConversation(conversationId, updates = {}) {
    const conv = this.conversations[conversationId];
    if (!conv) return null;

    if (updates.species) conv.species = updates.species.toLowerCase();
    if (updates.title) conv.title = updates.title;
    if (updates.pondId) conv.pondId = updates.pondId;

    conv.updatedAt = new Date().toISOString();
    this.save();
    return conv;
  }

  /**
   * Clear messages from a conversation (retaining the welcome message)
   */
  clearMessages(conversationId) {
    const conv = this.conversations[conversationId];
    if (!conv) return false;

    conv.messages = [
      {
        id: `msg-${Date.now()}-welcome`,
        role: 'assistant',
        content: 'Welcome to AquaCare! I am your AI Pond Doctor. You can share water readings (pH, DO, Ammonia, Nitrite, Temperature) or describe fish symptoms. All water quality thresholds are deterministically verified against certified aquaculture standards.',
        provider: 'system',
        model: 'aquacare-engine',
        timestamp: new Date().toLocaleTimeString(),
        sources: ['AquaCare Aquaculture Compendium', 'FAO Small-Scale Aquaculture Guidelines']
      }
    ];
    conv.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  /**
   * Delete a conversation completely
   */
  deleteConversation(conversationId) {
    if (this.conversations[conversationId]) {
      delete this.conversations[conversationId];
      this.save();
      return true;
    }
    return false;
  }
}

export const conversationStore = new ConversationStore();

