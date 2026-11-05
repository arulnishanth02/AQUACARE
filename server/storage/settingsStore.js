import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aiConfig } from '../ai/aiConfig.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SETTINGS_FILE = path.resolve(__dirname, 'ai_settings.json');

const DEFAULT_SETTINGS = {
  providerMode: aiConfig.defaultProvider, // 'auto' | 'gemini' | 'ollama'
  geminiModel: aiConfig.gemini.defaultModel,
  ollamaModel: aiConfig.ollama.defaultModel,
  ollamaBaseUrl: aiConfig.ollama.baseUrl,
  lastUpdated: new Date().toISOString()
};

class SettingsStore {
  constructor() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(SETTINGS_FILE)) {
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (err) {
      console.warn('Could not read settings file, using defaults:', err.message);
      this.settings = { ...DEFAULT_SETTINGS };
    }
  }

  save() {
    try {
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(this.settings, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist AI settings:', err.message);
    }
  }

  getSettings() {
    return { ...this.settings };
  }

  /**
   * Safe public settings (never expose secrets or full internal paths)
   */
  getPublicSettings() {
    return {
      providerMode: this.settings.providerMode,
      geminiModel: this.settings.geminiModel,
      ollamaModel: this.settings.ollamaModel,
      ollamaBaseUrl: this.settings.ollamaBaseUrl,
      geminiKeyConfigured: Boolean(aiConfig.gemini.apiKey && aiConfig.gemini.apiKey.length > 5),
      lastUpdated: this.settings.lastUpdated
    };
  }

  updateSettings(updates = {}) {
    const validModes = ['auto', 'gemini', 'ollama'];
    if (updates.providerMode && validModes.includes(updates.providerMode)) {
      this.settings.providerMode = updates.providerMode;
    }
    if (updates.geminiModel && typeof updates.geminiModel === 'string') {
      this.settings.geminiModel = updates.geminiModel;
    }
    if (updates.ollamaModel && typeof updates.ollamaModel === 'string') {
      this.settings.ollamaModel = updates.ollamaModel;
    }
    if (updates.ollamaBaseUrl && typeof updates.ollamaBaseUrl === 'string') {
      this.settings.ollamaBaseUrl = updates.ollamaBaseUrl;
    }

    this.settings.lastUpdated = new Date().toISOString();
    this.save();
    return this.getPublicSettings();
  }
}

export const settingsStore = new SettingsStore();
