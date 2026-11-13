import React, { useState, useEffect, useMemo } from 'react';
import { apiClient } from '../../api/client';
import FAQCard from './FAQCard';
import FAQDetailView from './FAQDetailView';
import {
  BookOpen,
  Search,
  ShieldCheck,
  HelpCircle,
  Filter,
  Sparkles,
  Droplets,
  HeartPulse,
  Activity,
  Sliders,
  Utensils,
  Layers,
  X
} from 'lucide-react';

const CATEGORY_ICONS = {
  'All': Layers,
  'Water Quality': Droplets,
  'Fish Health': HeartPulse,
  'Fish Behaviour': Activity,
  'Pond Management': Sliders,
  'Feeding and Nutrition': Utensils
};

export default function KnowledgeBrowser({ onAskAI, initialFaqId = null }) {
  // Navigation / View State
  const [selectedFaqId, setSelectedFaqId] = useState(initialFaqId);

  // FAQ Filter & Data State
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [faqSearch, setFaqSearch] = useState('');
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  // Verified KB Articles (Original Feature Preserved)
  const [articleQuery, setArticleQuery] = useState('');
  const [articleResults, setArticleResults] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // Synchronize route/history for /knowledge-base/faq/:faqId and #faq/:faqId
  useEffect(() => {
    const parseUrl = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const faqMatch = path.match(/\/knowledge-base\/faq\/([a-zA-Z0-9_-]+)/);
      const hashMatch = hash.match(/#faq\/([a-zA-Z0-9_-]+)/);
      if (faqMatch && faqMatch[1]) {
        setSelectedFaqId(faqMatch[1]);
      } else if (hashMatch && hashMatch[1]) {
        setSelectedFaqId(hashMatch[1]);
      } else if (initialFaqId) {
        setSelectedFaqId(initialFaqId);
      }
    };

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    window.addEventListener('hashchange', parseUrl);
    return () => {
      window.removeEventListener('popstate', parseUrl);
      window.removeEventListener('hashchange', parseUrl);
    };
  }, [initialFaqId]);

  const handleSelectFaq = (faqId) => {
    setSelectedFaqId(faqId);
    if (faqId) {
      window.history.pushState({ faqId }, '', `/knowledge-base/faq/${faqId}`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.history.pushState({}, '', '/knowledge-base');
    }
  };

  // Load FAQ Categories
  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await apiClient.getFaqCategories();
        if (res.success && Array.isArray(res.categories)) {
          setCategories(res.categories);
        }
      } catch (err) {
        console.error('Failed to load FAQ categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Load FAQs based on category and search
  useEffect(() => {
    let isMounted = true;
    async function loadFaqs() {
      setLoadingFaqs(true);
      try {
        const params = {};
        if (selectedCategory && selectedCategory !== 'All') {
          params.category = selectedCategory;
        }
        if (faqSearch.trim()) {
          params.search = faqSearch.trim();
        }
        const res = await apiClient.getFaqs(params);
        if (isMounted && res.success) {
          setFaqs(res.faqs || []);
        }
      } catch (err) {
        console.error('Failed to load FAQs:', err);
      } finally {
        if (isMounted) setLoadingFaqs(false);
      }
    }

    const timer = setTimeout(() => {
      loadFaqs();
    }, 180);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, faqSearch]);

  // Load Ground Truth Articles (Preserved from original)
  const fetchArticles = async (searchTerm = '') => {
    setLoadingArticles(true);
    try {
      const data = await apiClient.searchKnowledge(searchTerm);
      if (data.success) {
        setArticleResults(data.results?.matches || []);
      }
    } catch (err) {
      console.error('Failed to query knowledge articles:', err);
    } finally {
      setLoadingArticles(false);
    }
  };

  useEffect(() => {
    fetchArticles('');
  }, []);

  const handleArticleSearch = (e) => {
    e.preventDefault();
    fetchArticles(articleQuery);
  };

  // If a specific FAQ is selected, render the dedicated FAQ Detail View
  if (selectedFaqId) {
    return (
      <FAQDetailView
        faqId={selectedFaqId}
        onBack={() => handleSelectFaq(null)}
        onSelectFaq={(id) => handleSelectFaq(id)}
        onAskAI={onAskAI}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-12">
      {/* SECTION 1: Frequently Asked Questions (Primary Feature) */}
      <section className="space-y-6">
        {/* Section Header */}
        <div className="p-6 md:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-slate-50/80 to-teal-500/5 dark:from-slate-900 dark:via-slate-900/60 dark:to-teal-950/20 shadow-xl transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20 text-xs font-bold uppercase tracking-wider mb-2">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Knowledge Base &amp; Problem Solver</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Explore common fish pond problems, understand their causes, and discover practical solutions.
              </p>
            </div>

            {/* Live FAQ Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                placeholder="Search pond problems, symptoms..."
                className="w-full rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 font-medium transition-all shadow-inner"
              />
              {faqSearch && (
                <button
                  onClick={() => setFaqSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                selectedCategory === 'All'
                  ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                  : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Questions</span>
            </button>

            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.name] || HelpCircle;
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-teal-600/30 text-slate-950 font-bold' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400'
                  }`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQs Grid */}
        {loadingFaqs ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 animate-pulse space-y-4"
              >
                <div className="flex justify-between items-center">
                  <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                  <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="h-5 w-4/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-3 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded pt-2"></div>
              </div>
            ))}
          </div>
        ) : faqs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {faqs.map((faq) => (
              <FAQCard
                key={faq.id}
                faq={faq}
                onSelect={handleSelectFaq}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20">
            <HelpCircle className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">
              No Questions Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
              We couldn't find any pond problems matching "{faqSearch}" in category "{selectedCategory}".
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setFaqSearch('');
              }}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* SECTION 2: Verified Aquaculture Articles & Standards (Preserved Original Component) */}
      <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Verified Aquaculture Knowledge Base &amp; Protocols
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ground-truth standards used by both Google Gemini and Ollama via the shared deterministic RAG engine.
            </p>
          </div>

          <form onSubmit={handleArticleSearch} className="flex gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={articleQuery}
                onChange={(e) => setArticleQuery(e.target.value)}
                placeholder="Search disease SOPs, treatments, pH..."
                className="rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-purple-500 w-64 font-medium transition-colors"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/20 transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {articleResults.map((doc, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                    {doc.id.startsWith('disease') ? 'Disease Pathology' : doc.id.startsWith('species') ? 'Species Threshold' : 'Verified SOP'}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">Verified Ground Truth</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-2">{doc.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{doc.content}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span className="truncate max-w-[280px]">Citation: {doc.source}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
