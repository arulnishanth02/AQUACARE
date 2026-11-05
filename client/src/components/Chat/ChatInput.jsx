import React, { useState } from 'react';
import { Send, Sparkles, Fish } from 'lucide-react';

export default function ChatInput({ onSendMessage, loading, selectedSpecies, onSelectSpecies }) {
  const [text, setText] = useState('');

  const suggestions = [
    { label: '🐟 Morning gasping (DO 2.2 mg/L)', prompt: 'My tilapia are gasping at the surface early morning. DO is 2.2 mg/L and pH is 7.1. What should I do?' },
    { label: '🔴 Bloated Catfish (Dropsy?)', prompt: 'African catfish have swollen bellies and protruding scales. Mortality is 3%. Is this dropsy?' },
    { label: '⚪ White spots on fins', prompt: 'White salt-like spots appeared on fish skin and fins. They are flashing against the netting.' },
    { label: '⚠️ Ammonia spike (TAN 1.2 mg/L)', prompt: 'My pond ammonia is 1.2 mg/L and pH is 8.4. How can I protect my fish immediately?' }
  ];

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!text.trim() || loading) return;
    onSendMessage(text.trim());
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="pt-2 border-t border-slate-800 bg-slate-950/80">
      {/* Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 text-xs no-scrollbar">
        <span className="text-[10px] text-slate-500 uppercase font-bold shrink-0">Quick Scenarios:</span>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(s.prompt)}
            disabled={loading}
            className="shrink-0 px-2.5 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-teal-500/50 text-[11px] text-slate-300 transition-colors disabled:opacity-50"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        {/* Species selector */}
        <div className="shrink-0">
          <select
            value={selectedSpecies}
            onChange={(e) => onSelectSpecies(e.target.value)}
            disabled={loading}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-3 text-xs font-semibold text-teal-400 focus:outline-none focus:border-teal-500 cursor-pointer"
          >
            <option value="tilapia">Tilapia</option>
            <option value="catfish">Catfish</option>
            <option value="carp">Carp</option>
            <option value="shrimp">Shrimp</option>
          </select>
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Describe fish symptoms or enter pond readings (e.g. pH 6.8, DO 2.5, TAN 0.8)..."
          disabled={loading}
          className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={!text.trim() || loading}
          className="rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 p-3 font-semibold transition-all shadow-md shadow-teal-900/30 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}

