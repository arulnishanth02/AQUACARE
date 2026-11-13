import React from 'react';
import { Droplets, Sparkles, Activity, BookOpen, Settings, Sun, Moon } from 'lucide-react';
import ProviderBadge from './ProviderBadge';
import { useTheme } from '../context/ThemeContext';
import aquaCareLogo from '../assets/logo.png';

export default function Navbar({ activeTab, onSelectTab, onOpenSettings }) {
  const { theme, toggleTheme, isDark } = useTheme();

  const tabs = [
    { id: 'chat', label: 'AI Pond Doctor', icon: Sparkles },
    { id: 'lab', label: 'Water Quality Lab', icon: Activity },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'settings', label: 'AI Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/80 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onSelectTab('chat')}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-teal-500/30 shadow-md shadow-teal-500/10 group-hover:scale-105 transition-transform duration-200 shrink-0">
            <img
              src={aquaCareLogo}
              alt="AquaCare Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                AquaCare
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/10 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/20 dark:border-teal-500/30">
                Hybrid AI
              </span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Fish Pond Health & Diagnostics</p>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions: Theme Toggle + Provider Status Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Theme`}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          <ProviderBadge onOpenSettings={() => onSelectTab('settings')} />
        </div>
      </div>
    </header>
  );
}
