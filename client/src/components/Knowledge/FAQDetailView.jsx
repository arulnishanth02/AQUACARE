import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import {
  ArrowLeft,
  Sparkles,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Droplets,
  HeartPulse,
  Activity,
  Sliders,
  Utensils,
  BookOpen,
  HelpCircle,
  Stethoscope,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Clock,
  Wrench,
  Thermometer
} from 'lucide-react';

const CATEGORY_ICONS = {
  'Water Quality': Droplets,
  'Fish Health': HeartPulse,
  'Fish Behaviour': Activity,
  'Pond Management': Sliders,
  'Feeding and Nutrition': Utensils
};

const SEVERITY_BADGES = {
  Critical: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30',
    icon: AlertOctagon
  },
  Warning: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30',
    icon: AlertTriangle
  },
  Normal: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30',
    icon: CheckCircle2
  }
};

export default function FAQDetailView({ faqId, onBack, onSelectFaq, onAskAI }) {
  const [faq, setFaq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadFaq() {
      if (!faqId) return;
      setLoading(true);
      setError(null);
      try {
        const data = await apiClient.getFaqDetail(faqId);
        if (isMounted) {
          if (data.success && data.faq) {
            setFaq(data.faq);
          } else {
            setError('FAQ not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load FAQ details.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadFaq();
    // Scroll to top upon loading detail page
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [faqId]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
        <div className="h-64 rounded-3xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-48 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !faq) {
    return (
      <div className="max-w-3xl mx-auto p-8 rounded-3xl border border-rose-300 dark:border-rose-900 bg-white dark:bg-slate-900/60 text-center shadow-xl">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Question Not Found</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          The requested aquaculture problem detail (ID: <code className="font-mono text-rose-500">{faqId}</code>) could not be located in our knowledge database.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to Frequently Asked Questions
        </button>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[faq.category] || BookOpen;
  const sevBadge = SEVERITY_BADGES[faq.severity] || SEVERITY_BADGES.Normal;
  const SeverityIcon = sevBadge.icon;

  const handleAskAIClick = () => {
    const prompt = `I need help regarding this fish pond problem: "${faq.title}" (${faq.category}, Severity: ${faq.severity}).\n\nProblem Context: ${faq.overview}\n\nKey Signs observed: ${(faq.symptoms || []).join('; ')}\n\nWhat are the specific steps and precautions for my species?`;
    onAskAI(prompt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 transition-colors duration-200">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <button
          onClick={onBack}
          className="hover:text-teal-600 dark:hover:text-teal-400 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Knowledge Base &bull; FAQs
        </button>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        <span className="text-slate-600 dark:text-slate-400">{faq.category}</span>
        <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600" />
        <span className="text-slate-900 dark:text-slate-200 font-semibold truncate max-w-xs">{faq.title}</span>
      </nav>

      {/* SECTION A: Problem Overview Hero */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* Category Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
              <CategoryIcon className="w-4 h-4" />
              <span>{faq.category}</span>
            </span>

            {/* Severity Pill */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider border ${sevBadge.bg}`}>
              <SeverityIcon className="w-3.5 h-3.5" />
              <span>{faq.severity} Severity</span>
            </span>
          </div>

          {/* Quick AI Trigger Button */}
          <button
            onClick={handleAskAIClick}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-400 hover:from-teal-400 hover:to-emerald-300 text-slate-950 font-bold text-xs shadow-md shadow-teal-500/20 transition-all transform hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Ask AquaCare AI About This Problem</span>
          </button>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight mb-4">
          {faq.title}
        </h1>

        {/* Short Description */}
        <p className="text-base text-teal-700 dark:text-teal-300 font-medium mb-4 leading-relaxed">
          {faq.shortDescription}
        </p>

        {/* Full Overview Narrative */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <p>{faq.overview}</p>
        </div>
      </div>

      {/* SECTION B & C: Symptoms and Possible Causes (2-col grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SECTION B: Symptoms and Warning Signs */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Symptoms & Warning Signs</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Observable physical & behavioral indicators</p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {(faq.symptoms || []).map((symptom, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span>{symptom}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* SECTION C: Possible Causes */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Possible Causes</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Environmental and biological root triggers</p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {(faq.possibleCauses || []).map((cause, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-700/50 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">
                  {idx + 1}
                </span>
                <span>{cause}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* SECTION D: How to Identify the Problem */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-lg">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">How to Identify the Problem</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Practical on-site checks, measurements, and tests</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(faq.identification || []).map((step, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION E: Recommended Solutions */}
      <div className="rounded-3xl border border-teal-500/30 bg-teal-50/30 dark:bg-slate-900/60 p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2.5 mb-6 pb-4 border-b border-teal-500/20">
          <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-600 dark:text-teal-400 border border-teal-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Recommended Action Plan</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">Step-by-step verified aquaculture intervention protocols</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* E.1: Immediate Actions */}
          {Array.isArray(faq.immediateActions) && faq.immediateActions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Step 1: Immediate Actions (Emergency)
                </span>
              </div>
              <div className="space-y-2">
                {faq.immediateActions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900/40 text-xs font-medium text-slate-800 dark:text-slate-200 shadow-sm"
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E.2: Short-Term Solutions */}
          {Array.isArray(faq.shortTermSolutions) && faq.shortTermSolutions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/30">
                  Step 2: Short-Term Solutions (Stabilization)
                </span>
              </div>
              <div className="space-y-2">
                {faq.shortTermSolutions.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-amber-200 dark:border-amber-900/40 text-xs text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* E.3: Long-Term Preventive Measures */}
          {Array.isArray(faq.preventiveMeasures) && faq.preventiveMeasures.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30">
                  Step 3: Long-Term Preventive Measures
                </span>
              </div>
              <div className="space-y-2">
                {faq.preventiveMeasures.map((action, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 shadow-sm"
                  >
                    {action}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION F: Water Quality Information */}
      {Array.isArray(faq.waterQualityParameters) && faq.waterQualityParameters.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Droplets className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Relevant Water Quality Parameters</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Species-appropriate certified thresholds</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faq.waterQualityParameters.map((param, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
              >
                <div className="flex items-center justify-between font-bold text-xs text-slate-900 dark:text-slate-100 mb-2">
                  <span>{param.parameter}</span>
                  <span className="text-teal-600 dark:text-teal-400 font-mono text-[11px]">{param.idealRange}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    Critical Threshold: {param.criticalLevel}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed pt-1">
                    {param.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION G: When to Seek Expert Help */}
      {faq.expertHelp && (
        <div className="rounded-2xl border border-rose-300 dark:border-rose-900/50 bg-rose-50/60 dark:bg-rose-950/20 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider text-rose-800 dark:text-rose-300 mb-1">
                When to Seek Expert Veterinary / Extension Assistance
              </h4>
              <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                {faq.expertHelp}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION H: Related FAQs */}
      {Array.isArray(faq.relatedFaqsDetails) && faq.relatedFaqsDetails.length > 0 && (
        <div className="pt-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
            Related Questions & Problems
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {faq.relatedFaqsDetails.map((rel) => (
              <div
                key={rel.id}
                onClick={() => onSelectFaq(rel.id)}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-teal-500 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block mb-1">
                    {rel.category}
                  </span>
                  <h5 className="font-bold text-xs text-slate-900 dark:text-slate-100 line-clamp-2 mb-1">
                    {rel.title}
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                    {rel.shortDescription}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* References & Citations */}
      {Array.isArray(faq.references) && faq.references.length > 0 && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">Scientific Aquaculture References:</span>
            <span>{faq.references.join('; ')}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">AquaCare Knowledge Engine v2.0</span>
        </div>
      )}

      {/* SECTION I: Floating / Bottom Ask AI Banner */}
      <div className="rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-transparent p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-500" />
            Still Unsure About Your Pond's Specific Situation?
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl">
            Pass this problem context directly to AquaCare AI (Gemini or Ollama) to analyze your specific pond volume, species, and sensor readings.
          </p>
        </div>

        <button
          onClick={handleAskAIClick}
          className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-teal-900/20 transition-all"
        >
          <Sparkles className="w-4 h-4 fill-current" />
          <span>Ask AquaCare AI About This Problem</span>
        </button>
      </div>
    </div>
  );
}

