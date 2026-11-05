import React, { useState, useRef, useEffect } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import FallbackAlert from '../FallbackAlert';
import { apiClient } from '../../api/client';
import { useAI } from '../../context/AIContext';
import { Trash2, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export default function ChatWindow({ onOpenSettings }) {
  const { fallbackAlert, dismissFallbackAlert, triggerFallbackAlert, activeMode, activeProvider, effectiveModel } = useAI();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Welcome to AquaCare! I am your AI Pond Doctor. You can share water readings (pH, DO, Ammonia, Nitrite, Temperature) or describe fish symptoms. All water quality thresholds are deterministically verified against certified aquaculture standards.`,
      provider: activeProvider || 'gemini',
      model: effectiveModel || 'gemini-3.1-flash-lite',
      timestamp: new Date().toLocaleTimeString(),
      sources: ['AquaCare Aquaculture Compendium', 'FAO Small-Scale Aquaculture Guidelines']
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [selectedSpecies, setSelectedSpecies] = useState('tilapia');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text) => {
    if (!text || loading) return;

    setErrorMessage(null);

    const userMessage = {
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
        conversationHistory,
        species: selectedSpecies
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
        role: 'assistant',
        content: data.response,
        provider: data.provider,
        model: data.model,
        toolExecutions: data.toolExecutions || [],
        sources: data.sources || [],
        fallbackOccurred: data.fallbackOccurred,
        originalProvider: data.originalProvider,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
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

  const handleClearChat = () => {
    setMessages([]);
    setErrorMessage(null);
    dismissFallbackAlert();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-5xl mx-auto rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md shadow-2xl overflow-hidden p-4">
      {/* Top Controls */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Consultation Channel
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-teal-400 font-mono">
            Species: {selectedSpecies.toUpperCase()}
          </span>
        </div>

        <button
          onClick={handleClearChat}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors p-1"
          title="Clear Conversation"
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

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto pr-1 py-4">
        <MessageList messages={messages} loading={loading} />
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSendMessage={handleSendMessage}
        loading={loading}
        selectedSpecies={selectedSpecies}
        onSelectSpecies={setSelectedSpecies}
      />
    </div>
  );
}

