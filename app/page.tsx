'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import CopilotTab from '@/components/CopilotTab';
import DashboardTab from '@/components/DashboardTab';
import DiagnosticsTab from '@/components/DiagnosticsTab';
import KnowledgeTab from '@/components/KnowledgeTab';
import HotfixTab from '@/components/HotfixTab';
import SettingsTab from '@/components/SettingsTab';
import CommandPalette from '@/components/CommandPalette';

export default function Home() {
  const [activeTab, setActiveTab] = useState('copilot');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [diagInitial, setDiagInitial] = useState<{ type: string; target: string }>({
    type: 'trace',
    target: 'VVQR232R710618'
  });

  const handleNavigateToDiagnostics = (type: string, target: string) => {
    setDiagInitial({ type, target });
    setActiveTab('diagnostics');
  };

  const handleCommandPaletteAction = (type: string, payload: string) => {
    if (type === 'trace') {
      handleNavigateToDiagnostics('trace', payload);
    } else if (type === 'screen') {
      setActiveTab('knowledge');
    } else if (type === 'pop_error') {
      setActiveTab('knowledge');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-cyan-600/10 blur-[130px] animate-pulse-glow" />
        <div className="absolute top-[40%] right-[10%] w-[650px] h-[650px] rounded-full bg-indigo-600/10 blur-[160px] animate-pulse-glow" />
      </div>

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandPaletteAction}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'copilot' && (
          <CopilotTab onNavigateToDiagnostics={handleNavigateToDiagnostics} />
        )}
        {activeTab === 'dashboard' && <DashboardTab />}
        {activeTab === 'diagnostics' && (
          <DiagnosticsTab
            initialType={diagInitial.type}
            initialTarget={diagInitial.target}
          />
        )}
        {activeTab === 'knowledge' && <KnowledgeTab />}
        {activeTab === 'hotfix' && <HotfixTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 relative z-10 text-center text-xs text-slate-500">
        <p>
          Hệ Thống Vinatech MES Operations Copilot • Tác giả & Kỹ sư Vận hành: <span className="text-cyan-400 font-mono">Nguyen Van Duc (vanduc)</span> • Vercel Edge Cloud
        </p>
      </footer>
    </div>
  );
}
