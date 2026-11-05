import React, { useState } from 'react';
import { Activity, Stethoscope, BookOpen, ChevronDown, ChevronUp, CheckCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function ToolExecutionCard({ toolExecution }) {
  const [expanded, setExpanded] = useState(false);
  const { tool, input, output } = toolExecution;

  const toolLabels = {
    analyzeWaterQuality: {
      name: 'Deterministic Water Quality Engine',
      icon: Activity,
      color: 'text-teal-400 bg-teal-500/10 border-teal-500/30'
    },
    detectFishProblem: {
      name: 'Pathology & Fish Disease Detector',
      icon: Stethoscope,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/30'
    },
    searchAquacultureKnowledge: {
      name: 'Grounded Aquaculture Knowledge RAG',
      icon: BookOpen,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
    }
  };

  const meta = toolLabels[tool] || {
    name: tool,
    icon: Activity,
    color: 'text-slate-400 bg-slate-800 border-slate-700'
  };

  const Icon = meta.icon;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 my-2 text-xs">
      <div
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg border ${meta.color}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-200">{meta.name}</span>
          <span className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Deterministic Output
          </span>
        </div>

        <button className="text-slate-400 hover:text-slate-200 p-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Summary Preview */}
      {!expanded && output && (
        <div className="mt-2 text-[11px] text-slate-400 pl-7">
          {tool === 'analyzeWaterQuality' && (
            <div className="flex items-center gap-2">
              <span>Score: <strong className={output.overallScore < 50 ? 'text-rose-400' : 'text-emerald-400'}>{output.overallScore}/100 ({output.status})</strong></span>
              <span>•</span>
              <span>{output.anomaliesCount} anomalies detected</span>
            </div>
          )}
          {tool === 'detectFishProblem' && (
            <div className="flex items-center gap-2">
              <span>Match: <strong className="text-blue-300">{output.matchedConditions?.[0]?.disease || 'Evaluating'}</strong></span>
              <span>•</span>
              <span>Confidence: {output.matchedConditions?.[0]?.confidence || 'High'}</span>
            </div>
          )}
          {tool === 'searchAquacultureKnowledge' && (
            <div>
              <span>Retrieved {output.retrievedSources || 0} verified aquaculture references</span>
            </div>
          )}
        </div>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-[11px]">
          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Input Parameters:</span>
            <pre className="mt-1 bg-slate-950 p-2 rounded border border-slate-800/80 font-mono text-slate-300 overflow-x-auto">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>

          <div>
            <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">Deterministic Evaluation:</span>
            <pre className="mt-1 bg-slate-950 p-2 rounded border border-slate-800/80 font-mono text-emerald-300/90 overflow-x-auto max-h-48">
              {JSON.stringify(output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

