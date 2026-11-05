import React from 'react';
import { AlertTriangle, RefreshCw, X, ShieldAlert } from 'lucide-react';

export default function FallbackAlert({ alert, onDismiss, onOpenSettings }) {
  if (!alert) return null;

  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-amber-950/40 p-4 shadow-lg backdrop-blur-md mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400 border border-amber-500/30 mt-0.5">
            <RefreshCw className="h-5 w-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-amber-300">
                Automatic Provider Fallback Activated
              </h4>
              <span className="text-[10px] text-amber-400/80 bg-amber-900/60 px-2 py-0.5 rounded border border-amber-700/50">
                {alert.timestamp}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
              Your primary provider (<span className="font-semibold uppercase text-amber-100">{alert.originalProvider}</span>) encountered an interruption:
              <span className="italic block mt-0.5 text-amber-300/80 font-mono text-[11px] bg-slate-900/50 p-1.5 rounded border border-amber-500/20 my-1">
                "{alert.reason}"
              </span>
              AquaCare seamlessly routed your request to <span className="font-semibold uppercase text-emerald-300">{alert.newProvider}</span> without losing conversation history.
            </p>
            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={onOpenSettings}
                className="text-xs font-medium text-amber-400 hover:text-amber-200 underline underline-offset-2 flex items-center gap-1"
              >
                Inspect AI Provider Health & Settings &rarr;
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={onDismiss}
          className="text-amber-400/70 hover:text-amber-200 transition-colors p-1"
          title="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

