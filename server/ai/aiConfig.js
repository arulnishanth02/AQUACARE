import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const aiConfig = {
  port: parseInt(process.env.PORT || '5000', 10),
  defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'auto', // 'auto' | 'gemini' | 'ollama'
  requestTimeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '60000', 10),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    defaultModel: process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite',
    supportedModels: [
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', tier: 'Ultra Fast & Recommended' },
      { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash', tier: 'Standard Fast' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview', tier: 'High Reasoning' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', tier: 'Legacy Fast' }
    ],
    apiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta'
  },

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:7b',
    // Allowed hosts for security
    allowedHosts: ['127.0.0.1', 'localhost', '::1', 'host.docker.internal']
  }
};

export function validateEnvironment() {
  const issues = [];
  if (!aiConfig.gemini.apiKey) {
    issues.push('GEMINI_API_KEY is not set in environment variables.');
  }
  return {
    isValid: issues.length === 0,
    issues
  };
}
