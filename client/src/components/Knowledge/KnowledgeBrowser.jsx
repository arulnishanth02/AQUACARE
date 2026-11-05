import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { BookOpen, Search, ShieldCheck, Stethoscope, Droplets, Wrench } from 'lucide-react';

export default function KnowledgeBrowser() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchKnowledge = async (searchTerm = '') => {
    setLoading(true);
    try {
      const data = await apiClient.searchKnowledge(searchTerm);
      if (data.success) {
        setResults(data.results.matches || []);
      }
    } catch (err) {
      console.error('Failed to query knowledge:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKnowledge('');
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchKnowledge(query);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-bold text-slate-100">Verified Aquaculture Knowledge Base</h2>
          </div>
          <p className="text-xs text-slate-400">
            Ground-truth guidelines used by both Google Gemini and Ollama via the shared RAG engine.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search diseases, treatments, pH..."
              className="rounded-xl bg-slate-950 border border-slate-800 pl-9 pr-4 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-64 font-medium"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950/40"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((doc, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/40">
                  {doc.id.startsWith('disease') ? 'Disease Pathology' : doc.id.startsWith('species') ? 'Species Threshold' : 'Verified SOP'}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Verified Ground Truth</span>
              </div>
              <h4 className="font-bold text-slate-100 text-sm mb-2">{doc.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{doc.content}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate max-w-[280px]">Citation: {doc.source}</span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

