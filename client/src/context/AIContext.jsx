import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

const AIContext = createContext(null);

export function AIProvider({ children }) {
  const [activeMode, setActiveMode] = useState('auto');
  const [activeProvider, setActiveProvider] = useState('gemini');
  const [effectiveModel, setEffectiveModel] = useState('gemini-3.1-flash-lite');
  const [statusMessage, setStatusMessage] = useState('Initializing AI providers...');
  const [providersData, setProvidersData] = useState({
    gemini: { configured: false, available: false, status: 'checking', currentModel: 'gemini-3.1-flash-lite', latencyMs: 0 },
    ollama: { configured: false, available: false, status: 'checking', currentModel: 'qwen2.5:7b', installedModels: [], latencyMs: 0 }
  });
  const [modelsData, setModelsData] = useState({ gemini: [], ollama: [] });
  const [isChecking, setIsChecking] = useState(false);
  const [fallbackAlert, setFallbackAlert] = useState(null);
  const [lastTestResults, setLastTestResults] = useState({});

  const refreshHealth = useCallback(async () => {
    setIsChecking(true);
    try {
      const data = await apiClient.getProviders();
      if (data.success) {
        setActiveMode(data.activeMode);
        setActiveProvider(data.activeProvider);
        setEffectiveModel(data.effectiveModel);
        setProvidersData(data.providers);
      }
      const statusRes = await apiClient.getStatus();
      if (statusRes.success) {
        setStatusMessage(statusRes.statusMessage);
      }
    } catch (err) {
      console.error('Failed to refresh AI provider status:', err);
      setStatusMessage('Unable to connect to backend server.');
    } finally {
      setIsChecking(false);
    }
  }, []);

  const refreshModels = useCallback(async () => {
    try {
      const res = await apiClient.getModels();
      if (res.success) {
        setModelsData(res.models);
      }
    } catch (err) {
      console.error('Failed to load model list:', err);
    }
  }, []);

  useEffect(() => {
    refreshHealth();
    refreshModels();
    // Poll status periodically (every 30 seconds)
    const interval = setInterval(refreshHealth, 30000);
    return () => clearInterval(interval);
  }, [refreshHealth, refreshModels]);

  const switchMode = async (mode) => {
    try {
      setIsChecking(true);
      const res = await apiClient.setProviderSettings({ mode });
      if (res.success) {
        setActiveMode(res.settings.providerMode);
        setActiveProvider(res.activeProvider);
        setEffectiveModel(res.effectiveModel);
        await refreshHealth();
      }
      return res;
    } catch (err) {
      console.error('Failed to switch AI mode:', err);
      throw err;
    } finally {
      setIsChecking(false);
    }
  };

  const updateGeminiModel = async (model) => {
    try {
      const res = await apiClient.setProviderSettings({ geminiModel: model });
      if (res.success) {
        await refreshHealth();
      }
      return res;
    } catch (err) {
      console.error('Failed to update Gemini model:', err);
      throw err;
    }
  };

  const updateOllamaModel = async (model) => {
    try {
      const res = await apiClient.setProviderSettings({ ollamaModel: model });
      if (res.success) {
        await refreshHealth();
      }
      return res;
    } catch (err) {
      console.error('Failed to update Ollama model:', err);
      throw err;
    }
  };

  const updateOllamaBaseUrl = async (baseUrl) => {
    try {
      const res = await apiClient.setProviderSettings({ ollamaBaseUrl: baseUrl });
      if (res.success) {
        await refreshHealth();
        await refreshModels();
      }
      return res;
    } catch (err) {
      console.error('Failed to update Ollama URL:', err);
      throw err;
    }
  };

  const testProvider = async (provider, options = {}) => {
    try {
      const res = await apiClient.testConnection(provider, options);
      setLastTestResults(prev => ({
        ...prev,
        [provider]: {
          ...res.testResult,
          testedAt: new Date().toLocaleTimeString()
        }
      }));
      await refreshHealth();
      return res.testResult;
    } catch (err) {
      const failedResult = {
        provider,
        available: false,
        status: 'error',
        message: err.message,
        testedAt: new Date().toLocaleTimeString()
      };
      setLastTestResults(prev => ({ ...prev, [provider]: failedResult }));
      return failedResult;
    }
  };

  const triggerFallbackAlert = (originalProvider, newProvider, reason) => {
    setFallbackAlert({
      originalProvider,
      newProvider,
      reason,
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const dismissFallbackAlert = () => setFallbackAlert(null);

  const value = {
    activeMode,
    activeProvider,
    effectiveModel,
    statusMessage,
    providersData,
    modelsData,
    isChecking,
    fallbackAlert,
    lastTestResults,
    switchMode,
    updateGeminiModel,
    updateOllamaModel,
    updateOllamaBaseUrl,
    testProvider,
    refreshHealth,
    refreshModels,
    triggerFallbackAlert,
    dismissFallbackAlert
  };

  return <AIContext.Provider value={value}>{children}</AIContext.Provider>;
}

export function useAI() {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
}

