import React, { useState } from 'react';
import { HardDrive, RefreshCw, Play, Terminal, AlertCircle, Server } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import { useAI } from '../../context/AIContext';

export default function OllamaConfigCard() {
  const { providersData, modelsData, updateOllamaModel, updateOllamaBaseUrl, refreshModels, testProvider, lastTestResults } = useAI();
  const [testing, setTesting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hostUrl, setHostUrl] = useState(providersData?.ollama?.baseUrl || 'http://127.0.0.1:11434');
  const [testResult, setTestResult] = useState(lastTestResults?.ollama || null);

  const ollamaInfo = providersData?.ollama || {};
  const currentModel = ollamaInfo.currentModel || 'qwen2.5:7b';
  const installedModels = modelsData?.ollama || [];

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await testProvider('ollama', { model: currentModel, baseUrl: hostUrl });
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshModels();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveHost = async () => {
    await updateOllamaBaseUrl(hostUrl);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 flex items-center gap-2">
              Ollama Local AI
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-900/40 text-teal-300 border border-teal-700/50">
                Local Edge AI
              </span>
            </h3>
            <p className="text-xs text-slate-400">Private, offline-capable aquaculture inference</p>
          </div>
        </div>

        <StatusIndicator status={ollamaInfo.status} latencyMs={ollamaInfo.latencyMs} />
      </div>

      {/* Configuration Body */}
      <div className="mt-4 space-y-4 text-sm">
        {/* Host URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
            Ollama Host URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={hostUrl}
              onChange={(e) => setHostUrl(e.target.value)}
              placeholder="http://127.0.0.1:11434"
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-slate-200 focus:outline-none focus:border-teal-500 font-mono text-xs"
            />
            <button
              onClick={handleSaveHost}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
            >
              Update
            </button>
          </div>
        </div>

        {/* Model Selection & Refresh */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Installed Models
            </label>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1 text-[11px] text-teal-400 hover:text-teal-300 font-medium"
            >
              <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Models
            </button>
          </div>

          <select
            value={currentModel}
            onChange={(e) => updateOllamaModel(e.target.value)}
            className="w-full rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm font-medium font-mono"
          >
            {installedModels.length > 0 ? (
              installedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.size ? `(${m.size})` : ''} {m.installed ? '✓' : '(Not installed)'}
                </option>
              ))
            ) : (
              <option value={currentModel}>{currentModel}</option>
            )}
          </select>
        </div>

        {/* Instructions / Guidance if disconnected or missing model */}
        {(!ollamaInfo.available || ollamaInfo.status === 'model_missing') && (
          <div className="p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs text-amber-200/90 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <Terminal className="w-4 h-4" />
              <span>Ollama Quick Setup Guide</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Run these commands in your PowerShell / Terminal to start Ollama and install the model:
            </p>
            <div className="bg-slate-900 p-2 rounded font-mono text-[11px] text-emerald-400 select-all space-y-1">
              <div># 1. Start Ollama server</div>
              <div className="text-slate-100 font-bold">ollama serve</div>
              <div className="pt-1"># 2. Pull aquaculture-capable model</div>
              <div className="text-slate-100 font-bold">ollama pull {currentModel || 'qwen2.5:7b'}</div>
            </div>
          </div>
        )}

        {/* Message / Status Detail */}
        {ollamaInfo.message && (
          <p className="text-xs text-slate-400 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/50">
            {ollamaInfo.message}
          </p>
        )}

        {/* Actions & Test Result */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-medium text-xs shadow-md shadow-teal-900/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing Ollama Connection...' : 'Test Ollama Connection'}
          </button>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testResult.available
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="flex items-center justify-between font-semibold mb-1">
                <span>Result: {testResult.available ? 'Success' : 'Connection Failed'}</span>
                {testResult.latencyMs ? <span>{testResult.latencyMs}ms</span> : null}
              </div>
              <p className="opacity-90">{testResult.message}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

