import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ChatWindow from './components/Chat/ChatWindow';
import WaterQualityCalculator from './components/PondLab/WaterQualityCalculator';
import KnowledgeBrowser from './components/Knowledge/KnowledgeBrowser';
import ProviderSettings from './components/Settings/ProviderSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [initialChatMessage, setInitialChatMessage] = useState(null);

  // Check URL path or hash on initial mount and history changes
  useEffect(() => {
    const handleLocation = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path.startsWith('/knowledge-base') || hash.startsWith('#faq') || hash.startsWith('#knowledge')) {
        setActiveTab('knowledge');
      } else if (path.startsWith('/lab') || hash === '#lab') {
        setActiveTab('lab');
      } else if (path.startsWith('/settings') || hash === '#settings') {
        setActiveTab('settings');
      }
    };

    handleLocation();
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const handleSendToChat = (prompt) => {
    setInitialChatMessage(prompt);
    setActiveTab('chat');
    window.history.pushState({}, '', '/');
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      window.history.pushState({}, '', '/');
    } else if (tab === 'knowledge') {
      window.history.pushState({}, '', '/knowledge-base');
    } else if (tab === 'lab') {
      window.history.pushState({}, '', '/lab');
    } else if (tab === 'settings') {
      window.history.pushState({}, '', '/settings');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950 transition-colors duration-200">
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSettings={() => handleSelectTab('settings')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div style={{ display: activeTab === 'chat' ? 'block' : 'none' }}>
          <ChatWindow
            onOpenSettings={() => handleSelectTab('settings')}
            initialPrompt={initialChatMessage}
            onClearInitialPrompt={() => setInitialChatMessage(null)}
          />
        </div>

        {activeTab === 'lab' && (
          <WaterQualityCalculator onSendToChat={handleSendToChat} />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBrowser onAskAI={handleSendToChat} />
        )}

        {activeTab === 'settings' && (
          <ProviderSettings />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 py-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <img src="/logo.png" alt="AquaCare" className="w-4 h-4 rounded-full object-cover inline-block" />
        <span>AquaCare &bull; Intelligent Fish Pond Generative AI &bull; Google Gemini Cloud + Ollama Local Hybrid Architecture</span>
      </footer>
    </div>
  );
}
