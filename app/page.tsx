'use client';

import React, { useState } from 'react';
import Header from '@/components/Header';
import CopilotTab from '@/components/CopilotTab';
import DashboardTab from '@/components/DashboardTab';
import DiagnosticsTab from '@/components/DiagnosticsTab';
import KnowledgeTab from '@/components/KnowledgeTab';
import HotfixTab from '@/components/HotfixTab';
import SettingsTab from '@/components/SettingsTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState('copilot');
  const [diagInitial, setDiagInitial] = useState<{ type: string; target: string }>({
    type: 'trace',
    target: 'VVQR232R710618'
  });

  const handleNavigateToDiagnostics = (type: string, target: string) => {
    setDiagInitial({ type, target });
    setActiveTab('diagnostics');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Dynamic ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px]" />
        <div className="absolute top-[40%] right-[10%] w-[600px] h-[600px] rounded-full bg-indigo-600/10 blur-[150px]" />
      </div>

      {/* Main Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

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
      <footer className="border-t border-slate-900 bg-slate-950 py-4 relative z-10 text-center text-xs text-slate-500">
        <p>
          Hệ Thống Vinatech MES Operations Copilot • Author & Maintenance: <span className="text-cyan-400 font-mono">Nguyen Van Duc (vanduc)</span> • Vercel Ready
        </p>
      </footer>
    </div>
  );
}
