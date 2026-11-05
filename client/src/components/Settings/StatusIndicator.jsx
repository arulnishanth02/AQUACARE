import React from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function StatusIndicator({ status, latencyMs }) {
  if (status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <RefreshCw className="w-3 h-3 animate-spin" />
        Checking
      </span>
    );
  }

  if (status === 'connected') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Connected {latencyMs ? `(${latencyMs}ms)` : ''}
      </span>
    );
  }

  if (status === 'model_missing' || status === 'no_models') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3.5 h-3.5" />
        Model Not Installed
      </span>
    );
  }

  if (status === 'quota_exhausted') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertCircle className="w-3.5 h-3.5" />
        Quota Exhausted
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
      <XCircle className="w-3.5 h-3.5" />
      Disconnected
    </span>
  );
}

