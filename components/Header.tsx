'use client';

import React from 'react';
import { ShieldCheck, Activity, User, Server, Cloud } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Header({ activeTab, setActiveTab }: HeaderProps) {
  const tabs = [
    { id: 'copilot', label: 'AI Operations Copilot' },
    { id: 'dashboard', label: 'Live Dashboard' },
    { id: 'diagnostics', label: '1-Shot Diagnostics' },
    { id: 'knowledge', label: 'Ma Trận 97 Màn Hình & Lỗi' },
    { id: 'hotfix', label: 'Hotfix Console' },
    { id: 'settings', label: 'Cấu hình & Vercel' }
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">VINATECH MES</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800">
                  Operations Portal
                </span>
              </div>
              <p className="text-xs text-slate-400">Hệ thống Điều Hành & Chẩn Đoán Sản Xuất 360°</p>
            </div>
          </div>

          {/* Center Connection Telemetry */}
          <div className="hidden md:flex items-center space-x-4 bg-slate-900/60 border border-slate-800/80 rounded-full px-4 py-1.5 text-xs">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <Server className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-300 font-mono">dbserver.hycap.co.kr:5398</span>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center space-x-1.5 text-slate-400">
              <Cloud className="w-3.5 h-3.5 text-indigo-400" />
              <span>Vercel Edge Ready</span>
            </div>
          </div>

          {/* User IT Identity */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2.5 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5">
              <div className="w-7 h-7 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center">
                <User className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-right">
                <div className="text-xs font-semibold text-slate-200">Nguyen Van Duc</div>
                <div className="text-[10px] text-cyan-400 font-mono">vanduc • EA Team</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 overflow-x-auto pb-1 border-t border-slate-800/60 pt-1">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
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
