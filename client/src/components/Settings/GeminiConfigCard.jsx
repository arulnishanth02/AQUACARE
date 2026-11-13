import React, { useState } from 'react';
import { Cloud, KeyRound, Play, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import StatusIndicator from './StatusIndicator';
import { useAI } from '../../context/AIContext';

export default function GeminiConfigCard() {
  const { providersData, modelsData, updateGeminiModel, testProvider, lastTestResults } = useAI();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(lastTestResults?.gemini || null);

  const geminiInfo = providersData?.gemini || {};
  const currentModel = geminiInfo.currentModel || 'gemini-3.1-flash-lite';
  const models = modelsData?.gemini || [];

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await testProvider('gemini', { model: currentModel });
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Cloud className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Google Gemini API
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                Cloud AI
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">High-capacity multimodal reasoning and fast synthesis</p>
          </div>
        </div>

        <StatusIndicator status={geminiInfo.status} latencyMs={geminiInfo.latencyMs} />
      </div>

      {/* Configuration Body */}
      <div className="mt-4 space-y-4 text-sm">
        {/* Model Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
            Selected Gemini Model
          </label>
          <select
            value={currentModel}
            onChange={(e) => updateGeminiModel(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 text-sm font-medium"
          >
            {models.length > 0 ? (
              models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.tier ? `(${m.tier})` : ''}
                </option>
              ))
            ) : (
              <option value={currentModel}>{currentModel}</option>
            )}
          </select>
        </div>

        {/* API Key Status Indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Backend API Key</span>
          </div>

          {geminiInfo.configured ? (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Configured (Secure Server-side)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Missing from server .env</span>
            </div>
          )}
        </div>

        {/* Message / Status Detail */}
        {geminiInfo.message && (
          <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/50">
            {geminiInfo.message}
          </p>
        )}

        {/* Actions & Test Result */}
        <div className="pt-2 flex flex-col gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testing Gemini API Connection...' : 'Test Gemini Connection'}
          </button>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                testResult.available
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
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
