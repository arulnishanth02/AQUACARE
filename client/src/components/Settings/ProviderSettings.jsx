import React from 'react';
import { useAI } from '../../context/AIContext';
import { useTheme } from '../../context/ThemeContext';
import GeminiConfigCard from './GeminiConfigCard';
import OllamaConfigCard from './OllamaConfigCard';
import { Cpu, Zap, Cloud, HardDrive, CheckCircle2, ShieldAlert, Sparkles, Sun, Moon, Palette } from 'lucide-react';

export default function ProviderSettings() {
  const { activeMode, activeProvider, effectiveModel, statusMessage, isChecking, switchMode } = useAI();
  const { theme, setTheme, isDark } = useTheme();

  const modes = [
    {
      id: 'auto',
      title: 'Automatic Mode',
      subtitle: 'Recommended',
      description: 'Prefers Google Gemini. If Gemini encounters rate limits or quota issues, automatically falls back to Ollama local AI.',
      icon: Zap,
      accent: 'border-teal-500 bg-teal-500/10 text-teal-600 dark:text-teal-400'
    },
    {
      id: 'gemini',
      title: 'Google Gemini',
      subtitle: 'Cloud Only',
      description: 'Uses Google Gemini API exclusively. High reasoning capacity. Will not fall back to Ollama if unavailable.',
      icon: Cloud,
      accent: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
    },
    {
      id: 'ollama',
      title: 'Ollama Local',
      subtitle: 'Offline Edge',
      description: 'Uses locally running Ollama model exclusively. 100% private, no cloud internet required. Will not switch to Gemini.',
      icon: HardDrive,
      accent: 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-teal-500 dark:text-teal-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">AquaCare System Settings</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
              Configure your AI inference providers and personalize your application display theme. Changes apply immediately.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Current Active Provider</span>
              <span className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5 capitalize">
                {activeProvider ? `${activeProvider} (${effectiveModel})` : 'None Available'}
              </span>
            </div>
          </div>
        </div>

        {/* Status ticker */}
        <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 dark:bg-teal-400 animate-pulse" />
            <span>{statusMessage}</span>
          </div>
          {isChecking && <span className="text-[11px] text-amber-500 dark:text-amber-400 animate-pulse">Syncing provider status...</span>}
        </div>
      </div>

      {/* THEME SELECTION SECTION */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 shadow-lg">
        <div className="flex items-center gap-2.5 mb-1">
          <Palette className="w-5 h-5 text-teal-500 dark:text-teal-400" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Appearance & Interface Theme
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Select between Light theme (high-contrast for outdoor daylight use) and Dark theme (low eye strain).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Light Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4 ${
              !isDark
                ? 'border-teal-500 bg-teal-50/80 ring-2 ring-teal-500/20 shadow-md text-slate-900'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className={`p-3 rounded-xl border ${
              !isDark
                ? 'bg-amber-100 text-amber-600 border-amber-300 shadow-sm'
                : 'bg-slate-200 dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-800'
            }`}>
              <Sun className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Light Theme</span>
                {!isDark && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500 text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Daylight aquatic palette with high contrast, ideal for reading outdoors under direct sun at the pond.
              </p>
            </div>
          </button>

          {/* Dark Theme Card */}
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border-2 text-left transition-all duration-200 flex items-start gap-4 ${
              isDark
                ? 'border-teal-500 bg-teal-500/10 ring-2 ring-teal-500/20 shadow-md text-slate-100'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className={`p-3 rounded-xl border ${
              isDark
                ? 'bg-teal-500/20 text-teal-400 border-teal-500/30 shadow-sm'
                : 'bg-slate-200 dark:bg-slate-900 text-slate-500 border-slate-300 dark:border-slate-800'
            }`}>
              <Moon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">Dark Theme</span>
                {isDark && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-teal-500 text-slate-950 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Deep oceanic dark palette designed for reduced glare and comfortable nighttime pond monitoring.
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Mode Selector Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Select AI Operating Mode
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {modes.map((m) => {
            const Icon = m.icon;
            const isSelected = activeMode === m.id;

            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`text-left p-4 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? `${m.accent} shadow-lg ring-1 ring-teal-500/50`
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                      {m.subtitle}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm mb-1">{m.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.description}</p>
                </div>

                <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold">
                  {isSelected ? (
                    <span className="text-teal-600 dark:text-teal-400 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Active Mode
                    </span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">Click to Select &rarr;</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Provider Details (Gemini + Ollama) */}
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
          Provider Configurations & Diagnostic Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GeminiConfigCard />
          <OllamaConfigCard />
        </div>
      </div>
    </div>
  );
}
