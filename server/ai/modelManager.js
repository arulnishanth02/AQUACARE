import { aiConfig } from './aiConfig.js';
import { ollamaProvider } from './providers/ollamaProvider.js';

export class ModelManager {
  static getGeminiModels() {
    return aiConfig.gemini.supportedModels;
  }

  static async getOllamaModels(baseUrl) {
    try {
      const models = await ollamaProvider.listModels(baseUrl);
      if (models.length === 0) {
        // Fallback default suggestions if Ollama is empty or not yet pulled
        return [
          { id: 'qwen2.5:7b', name: 'Qwen 2.5 7B (Recommended for Aquaculture)', installed: false },
          { id: 'llama3.2:latest', name: 'Llama 3.2 3B (Lightweight)', installed: false },
          { id: 'mistral:latest', name: 'Mistral 7B', installed: false }
        ];
      }
      return models.map(m => ({
        id: m.id,
        name: m.name,
        size: m.size,
        installed: true
      }));
    } catch {
      return [];
    }
  }

  static async getAllModels(baseUrl) {
    const [geminiModels, ollamaModels] = await Promise.all([
      Promise.resolve(this.getGeminiModels()),
      this.getOllamaModels(baseUrl)
    ]);

    return {
      gemini: geminiModels,
      ollama: ollamaModels
    };
  }
}

