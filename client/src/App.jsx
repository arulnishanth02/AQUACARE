import React, { useState } from 'react';
import Navbar from './components/Navbar';
import ChatWindow from './components/Chat/ChatWindow';
import WaterQualityCalculator from './components/PondLab/WaterQualityCalculator';
import KnowledgeBrowser from './components/Knowledge/KnowledgeBrowser';
import ProviderSettings from './components/Settings/ProviderSettings';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat');
  const [initialChatMessage, setInitialChatMessage] = useState(null);

  const handleSendToChat = (prompt) => {
    setInitialChatMessage(prompt);
    setActiveTab('chat');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col selection:bg-teal-500 selection:text-slate-950">
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSettings={() => setActiveTab('settings')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'chat' && (
          <ChatWindow
            onOpenSettings={() => setActiveTab('settings')}
            initialPrompt={initialChatMessage}
          />
        )}

        {activeTab === 'lab' && (
          <WaterQualityCalculator onSendToChat={handleSendToChat} />
        )}

        {activeTab === 'knowledge' && (
          <KnowledgeBrowser />
        )}

        {activeTab === 'settings' && (
          <ProviderSettings />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 text-center text-xs text-slate-500">
        AquaCare &bull; Intelligent Fish Pond Generative AI &bull; Google Gemini Cloud + Ollama Local Hybrid Architecture
      </footer>
    </div>
  );
}

