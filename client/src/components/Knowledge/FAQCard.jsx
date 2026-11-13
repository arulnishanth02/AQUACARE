import React from 'react';
import {
  Droplets,
  HeartPulse,
  Activity,
  Sliders,
  Utensils,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  ArrowRight,
  BookOpen
} from 'lucide-react';

const CATEGORY_META = {
  'Water Quality': {
    icon: Droplets,
    badgeColor: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/40',
    iconColor: 'text-cyan-500'
  },
  'Fish Health': {
    icon: HeartPulse,
    badgeColor: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/40',
    iconColor: 'text-rose-500'
  },
  'Fish Behaviour': {
    icon: Activity,
    badgeColor: 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/40',
    iconColor: 'text-purple-500'
  },
  'Pond Management': {
    icon: Sliders,
    badgeColor: 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/40',
    iconColor: 'text-blue-500'
  },
  'Feeding and Nutrition': {
    icon: Utensils,
    badgeColor: 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
    iconColor: 'text-amber-500'
  }
};

const SEVERITY_META = {
  Critical: {
    icon: AlertOctagon,
    badgeColor: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-500/30'
  },
  Warning: {
    icon: AlertTriangle,
    badgeColor: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-500/30'
  },
  Normal: {
    icon: CheckCircle2,
    badgeColor: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-500/30'
  }
};

export default function FAQCard({ faq, onSelect }) {
  const catMeta = CATEGORY_META[faq.category] || {
    icon: BookOpen,
    badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    iconColor: 'text-teal-500'
  };

  const sevMeta = SEVERITY_META[faq.severity] || SEVERITY_META.Normal;

  const CategoryIcon = catMeta.icon;
  const SeverityIcon = sevMeta.icon;

  return (
    <div
      onClick={() => onSelect(faq.id)}
      className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5 shadow-sm hover:shadow-xl hover:border-teal-500/50 dark:hover:border-teal-500/40 transition-all duration-200 cursor-pointer overflow-hidden"
    >
      {/* Top Meta: Category & Severity */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Category Tag */}
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${catMeta.badgeColor}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{faq.category}</span>
          </span>

          {/* Severity Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${sevMeta.badgeColor}`}>
            <SeverityIcon className="w-3 h-3" />
            <span>{faq.severity}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-2 leading-snug mb-2">
          {faq.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {faq.shortDescription}
        </p>

        {/* Symptoms preview pills if present */}
        {Array.isArray(faq.symptomsPreview) && faq.symptomsPreview.length > 0 && (
          <div className="space-y-1 mb-4 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Key Signs:</span>
            <ul className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
              {faq.symptomsPreview.map((s, idx) => (
                <li key={idx} className="truncate flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-teal-500 shrink-0" />
                  <span className="truncate">{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Card Action Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-teal-600 dark:text-teal-400 group-hover:text-teal-500">
        <span>Read Problem Solutions</span>
        <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}

