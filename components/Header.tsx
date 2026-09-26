'use client';

import React from 'react';
import { ShieldCheck, Activity, User, Server, Cloud, Search, Command } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCommandPalette: () => void;
}

export default function Header({ activeTab, setActiveTab, onOpenCommandPalette }: HeaderProps) {
  const tabs = [
    { id: 'copilot', label: 'AI Operations Copilot' },
    { id: 'dashboard', label: 'Live Dashboard' },
    { id: 'diagnostics', label: '1-Shot Diagnostics' },
    { id: 'knowledge', label: 'Ma Trận 97 Màn Hình & Lỗi' },
    { id: 'hotfix', label: 'Hotfix Console' },
    { id: 'settings', label: 'Cấu hình & Vercel' }
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/30">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  VINATECH MES
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/80 shadow-sm">
                  Operations Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hệ Thống Điều Hành & Chẩn Đoán Sản Xuất 360°</p>
            </div>
          </div>

          {/* Quick Command Launcher (Ctrl + K) */}
          <button
            onClick={onOpenCommandPalette}
            className="hidden md:flex items-center space-x-3 bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 px-3.5 py-1.5 rounded-xl text-xs text-slate-400 transition shadow-inner group"
          >
            <Search className="w-4 h-4 text-cyan-400 group-hover:text-cyan-300 transition" />
            <span>Tìm màn hình, mã lỗi, Lot...</span>
            <kbd className="hidden lg:inline-flex items-center gap-1 font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              <Command className="w-3 h-3" /> K
            </kbd>
          </button>

          {/* User IT Identity */}
          <div className="flex items-center space-x-3">
            <div className="hidden sm:flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-full px-3 py-1 text-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-slate-300 font-mono text-[11px]">dbserver:5398</span>
            </div>

            <div className="flex items-center space-x-2.5 bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-700 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-200">Nguyen Van Duc</div>
                <div className="text-[10px] text-cyan-400 font-mono">vanduc • EA Team</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1.5 overflow-x-auto pb-1.5 border-t border-slate-800/60 pt-1.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
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
