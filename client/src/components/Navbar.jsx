import React from 'react';
import { Droplets, Sparkles, Activity, BookOpen, Settings } from 'lucide-react';
import ProviderBadge from './ProviderBadge';

export default function Navbar({ activeTab, onSelectTab, onOpenSettings }) {
  const tabs = [
    { id: 'chat', label: 'AI Pond Doctor', icon: Sparkles },
    { id: 'lab', label: 'Water Quality Lab', icon: Activity },
    { id: 'knowledge', label: 'Knowledge Base', icon: BookOpen },
    { id: 'settings', label: 'AI Settings', icon: Settings }
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('chat')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/20">
            <Droplets className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white">AquaCare</span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                Hybrid AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Fish Pond Health & Diagnostics</p>
          </div>
        </div>

        {/* Tab Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-900/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Provider Status Badge */}
        <div className="flex items-center gap-3">
          <ProviderBadge onOpenSettings={() => onSelectTab('settings')} />
        </div>
      </div>
    </header>
  );
}

