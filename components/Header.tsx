'use client';

import React from 'react';
import { ShieldCheck, User, Search, Command, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenCommandPalette,
  theme,
  toggleTheme
}: HeaderProps) {
  const tabs = [
    { id: 'quick_actions', label: '⚡ Cấp Cứu 1-Click' },
    { id: 'copilot', label: 'AI Operations Copilot' },
    { id: 'dashboard', label: 'Live Dashboard' },
    { id: 'diagnostics', label: 'Diagnostics 360°' },
    { id: 'sql_studio', label: '💻 SQL Studio' },
    { id: 'weekly_report', label: '📋 Báo Cáo Tuần IT' },
    { id: 'knowledge', label: 'Ma Trận & KB' },
    { id: 'hotfix', label: 'Hotfix Console' },
    { id: 'settings', label: 'Cấu hình & Relay' }
  ];

  return (
    <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30 shrink-0">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
                  VINATECH MES
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800/80 shadow-sm">
                  Operations Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Hệ Thống Điều Hành & Chẩn Đoán Sản Xuất 360°</p>
            </div>
          </div>

          {/* Quick Command Launcher (Ctrl + K) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center space-x-3 bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-850 border border-slate-200 dark:border-slate-800 px-3.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 transition shadow-sm group"
          >
            <Search className="w-4 h-4 text-cyan-600 dark:text-cyan-400 group-hover:text-cyan-500 transition" />
            <span>Tìm màn hình, mã lỗi, Lot...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>

          {/* Right Controls: Theme Toggle & User ID */}
          <div className="flex items-center space-x-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 transition"
              title={theme === 'dark' ? 'Chuyển sang Giao diện Sáng' : 'Chuyển sang Giao diện Tối'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Live Connection Pill */}
            <div className="hidden sm:flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-full px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-mono text-[11px]">dbserver:5398</span>
            </div>

            {/* User IT Identity */}
            <div className="flex items-center space-x-2.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
              <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-300 dark:border-indigo-700 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">Nguyen Van Duc</div>
                <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">vanduc • EA Team</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1.5 border-t border-slate-200/80 dark:border-slate-800/60 pt-1.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
