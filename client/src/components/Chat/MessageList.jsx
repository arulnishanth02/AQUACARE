import React from 'react';
import { User, Sparkles, Cloud, HardDrive, BookOpen, AlertTriangle, ShieldCheck } from 'lucide-react';
import ToolExecutionCard from './ToolExecutionCard';
import aquaCareLogo from '../../assets/logo.png';

export default function MessageList({ messages, loading }) {
  if (messages.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-500">
        <div className="w-20 h-20 rounded-2xl overflow-hidden border border-teal-500/30 bg-white dark:bg-slate-900 shadow-xl p-1 mb-4">
          <img src={aquaCareLogo} alt="AquaCare Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">AquaCare AI Pond Doctor</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 leading-relaxed">
          Ask any question about fish behavior, symptoms, or water quality measurements (pH, Dissolved Oxygen, Ammonia, Nitrite, Temperature).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-4">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';

        return (
          <div
            key={index}
            className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
          >
            {/* AI Avatar */}
            {!isUser && (
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-teal-500/30 dark:border-teal-500/40 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <img src={aquaCareLogo} alt="AquaCare AI" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Message Body */}
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                isUser
                  ? 'bg-teal-600 text-white rounded-br-none shadow-md shadow-teal-950/20'
                  : 'bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-bl-none text-slate-800 dark:text-slate-200 shadow-lg'
              }`}
            >
              {/* Message Header (Provider tag for assistant) */}
              {!isUser && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    {msg.provider === 'gemini' ? (
                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold">
                        <Cloud className="w-3.5 h-3.5" /> Gemini ({msg.model})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-teal-700 dark:text-teal-400 font-semibold">
                        <HardDrive className="w-3.5 h-3.5" /> Ollama Local ({msg.model})
                      </span>
                    )}

                    {msg.fallbackOccurred && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Fallback routed from {msg.originalProvider}
                      </span>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{msg.timestamp}</span>
                </div>
              )}

              {/* Tool Execution Cards if generated */}
              {!isUser && Array.isArray(msg.toolExecutions) && msg.toolExecutions.length > 0 && (
                <div className="mb-3 space-y-1.5">
                  <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
                    Deterministic Backend Checks:
                  </div>
                  {msg.toolExecutions.map((tool, idx) => (
                    <ToolExecutionCard key={idx} toolExecution={tool} />
                  ))}
                </div>
              )}

              {/* Main Response Content */}
              <div className="text-sm leading-relaxed whitespace-pre-wrap break-words font-normal">
                {msg.content}
              </div>

              {/* Sources / Citations */}
              {!isUser && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-semibold mb-1.5 text-[11px]">
                    <BookOpen className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                    <span>Verified Knowledge Citations:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[10px] font-medium text-slate-700 dark:text-slate-300"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar */}
            {isUser && (
              <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        );
      })}

      {/* Loading Skeleton */}
      {loading && (
        <div className="flex gap-3.5 justify-start">
          <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-600 dark:text-teal-300 flex items-center justify-center shrink-0 animate-pulse">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl rounded-bl-none px-5 py-4 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-3 shadow-lg">
            <div className="flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Evaluating pond parameters with verified aquaculture logic...</span>
          </div>
        </div>
      )}
    </div>
  );
}
