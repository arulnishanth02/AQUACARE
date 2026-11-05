import React from 'react';
import { useAI } from '../context/AIContext';
import { Sparkles, Cpu, RefreshCw, AlertTriangle, Cloud, HardDrive } from 'lucide-react';

export default function ProviderBadge({ fallbackInfo, onOpenSettings }) {
  const { activeMode, activeProvider, effectiveModel, isChecking, providersData } = useAI();

  const isGemini = activeProvider === 'gemini';
  const isOllama = activeProvider === 'ollama';

  const providerStatus = isGemini ? providersData?.gemini?.status : providersData?.ollama?.status;
  const isConnected = isGemini ? providersData?.gemini?.available : providersData?.ollama?.available;

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onOpenSettings}
        className="group flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700 hover:border-teal-500/50 shadow-sm transition-all duration-200 text-xs"
        title="Click to open AI Provider Settings"
      >
        {/* Status Indicator Dot */}
        <span className="relative flex h-2 w-2">
          {isChecking ? (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          ) : isConnected ? (
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          ) : (
            <span className="absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              isChecking
                ? 'bg-amber-400'
                : isConnected
                ? 'bg-emerald-500'
                : 'bg-rose-500'
            }`}
          />
        </span>

        {/* Provider Icon & Name */}
        <div className="flex items-center gap-1.5 font-medium text-slate-200">
          {isGemini ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-semibold text-blue-300">Gemini Cloud</span>
            </>
          ) : isOllama ? (
            <>
              <HardDrive className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-semibold text-teal-300">Ollama Local</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-rose-300">AI Offline</span>
            </>
          )}

          <span className="text-slate-500 font-mono text-[10px]">
            ({effectiveModel || 'no model'})
          </span>
        </div>

        {/* Mode Tag */}
        <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700/60 group-hover:border-teal-500/30">
          {activeMode}
        </span>

        {/* Fallback Active Badge */}
        {fallbackInfo?.fallbackOccurred && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
            <RefreshCw className="w-2.5 h-2.5" />
            Fallback Active
          </span>
        )}
      </button>
    </div>
  );
}
