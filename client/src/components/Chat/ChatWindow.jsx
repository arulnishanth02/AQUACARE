import React, { useState, useRef, useEffect, useCallback } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import FallbackAlert from '../FallbackAlert';
import { apiClient } from '../../api/client';
import { useAI } from '../../context/AIContext';
import { usePond } from '../../context/PondContext';
import { Trash2, AlertCircle, RefreshCw, Layers, CheckCircle2, Droplets } from 'lucide-react';

export default function ChatWindow({ onOpenSettings, initialPrompt, onClearInitialPrompt }) {
  const { fallbackAlert, dismissFallbackAlert, triggerFallbackAlert, activeMode, activeProvider, effectiveModel } = useAI();
  const {
    selectedPondId,
    selectedSpecies,
    updateSelectedSpecies,
    updateSelectedPond,
    ponds,
    activePond,
    latestWaterQuality
  } = usePond();

  const [messages, setMessages] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!loadingHistory) {
      scrollToBottom();
    }
  }, [messages, loading, loadingHistory]);

  // Load persistent chat history from backend database/storage
  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setErrorMessage(null);
    try {
      const data = await apiClient.getChatHistory(selectedPondId);
      if (data.success && data.conversation && Array.isArray(data.conversation.messages)) {
        // Prevent duplicates by tracking unique message ids/timestamps
        const seen = new Set();
        const uniqueMessages = [];
        for (const msg of data.conversation.messages) {
          const key = msg.id || `${msg.role}-${msg.content.substring(0, 40)}`;
          if (!seen.has(key)) {
            seen.add(key);
            uniqueMessages.push(msg);
          }
        }
        setMessages(uniqueMessages);

        // Keep species aligned with conversation if conversation has one
        if (data.conversation.species && data.conversation.species !== selectedSpecies) {
          updateSelectedSpecies(data.conversation.species);
        }
      }
    } catch (err) {
      console.warn('Failed to load chat history from backend:', err);
      // Fallback welcome message if backend call failed
      setMessages([
        {
          id: 'welcome-default',
          role: 'assistant',
          content: 'Welcome to AquaCare! I am your AI Pond Doctor. You can share water readings (pH, DO, Ammonia, Nitrite, Temperature) or describe fish symptoms. All water quality thresholds are deterministically verified against certified aquaculture standards.',
          provider: activeProvider || 'gemini',
          model: effectiveModel || 'gemini-3.1-flash-lite',
          timestamp: new Date().toLocaleTimeString(),
          sources: ['AquaCare Aquaculture Compendium', 'FAO Small-Scale Aquaculture Guidelines']
        }
      ]);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedPondId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // Automatically process initialPrompt when redirected from WaterQualityLab or FAQ KnowledgeBase
  useEffect(() => {
    if (initialPrompt && !loading && !loadingHistory) {
      handleSendMessage(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt, loadingHistory]);

  const handleSendMessage = async (text) => {
    if (!text || loading) return;

    setErrorMessage(null);

    const tempId = `user-msg-${Date.now()}`;
    const userMessage = {
      id: tempId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    // Build history for backend
    const conversationHistory = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));

    try {
      const data = await apiClient.sendChatMessage({
        message: text,
        conversationId: `conv-${selectedPondId}`,
        pondId: selectedPondId,
        species: selectedSpecies,
        fishSpecies: selectedSpecies,
        conversationHistory
      });

      // Check if fallback occurred
      if (data.fallbackOccurred) {
        triggerFallbackAlert(
          data.originalProvider || 'Gemini',
          data.provider,
          data.fallbackReason || 'Service unavailable'
        );
      }

      const assistantMessage = {
        id: data.assistantMessage?.id || `ast-msg-${Date.now()}`,
        role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
        toolExecutions: data.toolExecutions || [],
        sources: data.sources || [],
        waterAnalysis: data.waterAnalysis || null,
        diseaseDiagnosis: data.diseaseDiagnosis || null,
        fallbackOccurred: data.fallbackOccurred,
        originalProvider: data.originalProvider,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => {
        // Deduplicate and append
        const filtered = prev.filter(m => m.id !== tempId);
        const savedUserMsg = data.userMessage || userMessage;
        return [...filtered, savedUserMsg, assistantMessage];
      });
    } catch (err) {
      console.error('Chat error:', err);
      setErrorMessage({
        text: err.message || 'Failed to generate response.',
        recoveryGuidance: err.recoveryGuidance,
        provider: err.provider
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await apiClient.clearChatHistory(`conv-${selectedPondId}`);
    } catch (err) {
      console.warn('Could not clear backend conversation:', err);
    }
    setMessages([
      {
        id: `msg-${Date.now()}-welcome`,
        role: 'assistant',
        content: 'Welcome to AquaCare! I am your AI Pond Doctor. You can share water readings (pH, DO, Ammonia, Nitrite, Temperature) or describe fish symptoms. All water quality thresholds are deterministically verified against certified aquaculture standards.',
        provider: 'system',
        model: 'aquacare-engine',
        timestamp: new Date().toLocaleTimeString(),
        sources: ['AquaCare Aquaculture Compendium', 'FAO Small-Scale Aquaculture Guidelines']
      }
    ]);
    setErrorMessage(null);
    dismissFallbackAlert();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 backdrop-blur-md shadow-2xl overflow-hidden p-4 transition-colors duration-200">
      {/* Top Controls: Pond Selection, Species Badge, Connected Water Quality Lab status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pond Selector */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <Layers className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <select
              value={selectedPondId}
              onChange={(e) => updateSelectedPond(e.target.value)}
              disabled={loading || loadingHistory}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {ponds.map((p) => (
                <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Species Badge */}
          <span className="text-[11px] px-2.5 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/40 font-mono font-bold uppercase tracking-wider">
            Species: {selectedSpecies}
          </span>

          {/* Connected Water Quality Lab indicator */}
          {latestWaterQuality && (
            <span
              title={`Water Quality Lab Data: DO ${latestWaterQuality.dissolvedOxygen} mg/L, pH ${latestWaterQuality.ph}, TAN ${latestWaterQuality.ammonia} mg/L`}
              className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 font-medium"
            >
              <Droplets className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>Lab Readings Synced (DO: {latestWaterQuality.dissolvedOxygen} mg/L, pH: {latestWaterQuality.ph})</span>
            </span>
          )}
        </div>

        <button
          onClick={handleClearChat}
          disabled={loading || loadingHistory}
          className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors p-1 disabled:opacity-50"
          title="Clear Conversation History"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Chat</span>
        </button>
      </div>

      {/* Fallback Alert Banner */}
      <div className="mt-3">
        <FallbackAlert
          alert={fallbackAlert}
          onDismiss={dismissFallbackAlert}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Error Recovery Banner */}
      {errorMessage && (
        <div className="my-2 p-4 rounded-xl border border-rose-500/30 bg-rose-950/40 text-xs text-rose-200">
          <div className="flex items-center gap-2 font-bold text-rose-300 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>AI Request Interruption</span>
          </div>
          <p className="whitespace-pre-wrap">{errorMessage.text}</p>
          {errorMessage.recoveryGuidance && (
            <div className="mt-2 pt-2 border-t border-rose-500/20 text-rose-300 flex items-center justify-between">
              <span>{errorMessage.recoveryGuidance}</span>
              <button
                onClick={onOpenSettings}
                className="underline font-semibold hover:text-white"
              >
                Open AI Settings &rarr;
              </button>
            </div>
          )}
        </div>
      )}

      {/* Message Area with Loading State */}
      {loadingHistory ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
          <RefreshCw className="w-6 h-6 text-teal-500 animate-spin" />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Restoring persistent conversation for {activePond?.name || selectedPondId}...
          </span>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 py-4">
          <MessageList messages={messages} loading={loading} />
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        loading={loading || loadingHistory}
        selectedSpecies={selectedSpecies}
        onSelectSpecies={updateSelectedSpecies}
      />
    </div>
  );
}
