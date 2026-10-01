'use client';

import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import QuickActionsTab from '@/components/QuickActionsTab';
import CopilotTab from '@/components/CopilotTab';
import DashboardTab from '@/components/DashboardTab';
import DiagnosticsTab from '@/components/DiagnosticsTab';
import WeeklyReportTab from '@/components/WeeklyReportTab';
import KnowledgeTab from '@/components/KnowledgeTab';
import HotfixTab from '@/components/HotfixTab';
import SettingsTab from '@/components/SettingsTab';
import SqlStudioTab from '@/components/SqlStudioTab';
import CommandPalette from '@/components/CommandPalette';
import FloatingSpeedDial from '@/components/FloatingSpeedDial';
import SqlApprovalModal from '@/components/SqlApprovalModal';

export default function Home() {
  const [activeTab, setActiveTab] = useState('quick_actions');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [quickUnlockModal, setQuickUnlockModal] = useState<{ isOpen: boolean; machine: string } | null>(null);
  const [diagInitial, setDiagInitial] = useState<{ type: string; target: string }>({
    type: 'trace',
    target: ''
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('vinatech_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        setActiveTab('quick_actions');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        setActiveTab('copilot');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        setActiveTab('dashboard');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault();
        setActiveTab('diagnostics');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '5') {
        e.preventDefault();
        setActiveTab('weekly_report');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '6') {
        e.preventDefault();
        setActiveTab('knowledge');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '7') {
        e.preventDefault();
        setActiveTab('hotfix');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '8') {
        e.preventDefault();
        setActiveTab('settings');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '9') {
        e.preventDefault();
        setActiveTab('sql_studio');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('vinatech_theme', nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

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
    <div className="min-h-screen flex flex-col transition-colors duration-300 selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glow (Dark mode) / Subtle mesh (Light mode) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[550px] h-[550px] rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-[130px] animate-pulse-glow" />
        <div className="absolute top-[40%] right-[10%] w-[650px] h-[650px] rounded-full bg-indigo-500/10 dark:bg-indigo-600/10 blur-[160px] animate-pulse-glow" />
      </div>

      {/* Main Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Command Palette Modal (Ctrl + K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectAction={handleCommandPaletteAction}
      />

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {activeTab === 'quick_actions' && <QuickActionsTab />}
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
        {activeTab === 'sql_studio' && <SqlStudioTab />}
        {activeTab === 'weekly_report' && <WeeklyReportTab />}
        {activeTab === 'knowledge' && <KnowledgeTab />}
        {activeTab === 'hotfix' && <HotfixTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>

      {/* Floating Speed Dial */}
      <FloatingSpeedDial
        onNavigateTab={(tab) => setActiveTab(tab)}
        onOpenUnlockModal={() => setQuickUnlockModal({ isOpen: true, machine: 'VVMHY130' })}
      />

      {/* Quick Unlock Machine Modal */}
      {quickUnlockModal?.isOpen && (
        <SqlApprovalModal
          isOpen={true}
          onClose={() => setQuickUnlockModal(null)}
          title={`Mở Khóa Khẩn Cấp Thiết Bị: ${quickUnlockModal.machine}`}
          targetDb="VINATECH_POP"
          sql={`-- ======================================================================
-- HOTFIX: GIAI PHONG THIET BI BI KET ACTIVE TREN KIOSK POP (RULE 20.5)
-- Bang muc tieu: VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING
-- Tac gia: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

UPDATE VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING
SET MAPPING_STATUS      = 'RELEASED',
    RELEASED_AT         = GETDATE(),
    RELEASE_REASON      = N'IT 1-Click unlock by Speed Dial (vanduc)',
    NO_EMP_MODIFYER     = 'vanduc',
    CD_COMPANY_MODIFYER = 'VINA'
WHERE (EQUIPMENT_NAME = '${quickUnlockModal.machine}' OR EQUIPMENT_ID = '${quickUnlockModal.machine}')
  AND MAPPING_STATUS IN ('ACTIVE', 'AUTO_MAPPED');

SELECT @@ROWCOUNT AS [RowsAffected];
ROLLBACK TRAN;
-- COMMIT TRAN;`}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white/80 dark:bg-slate-950/80 py-4 relative z-10 text-center text-xs text-slate-500 dark:text-slate-500 transition-colors">
        <p>
          Hệ Thống Vinatech MES Operations Copilot • Tác giả & Kỹ sư Vận hành: <span className="text-cyan-600 dark:text-cyan-400 font-mono">Nguyen Van Duc (vanduc - EA Team)</span> • Vercel Edge Cloud
        </p>
      </footer>
    </div>
  );
}
