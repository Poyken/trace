'use client';

import React, { useState } from 'react';
import { 
  Zap, 
  RotateCcw, 
  Lock, 
  FileSpreadsheet, 
  HelpCircle, 
  X, 
  ChevronUp,
  Keyboard,
  ShieldCheck
} from 'lucide-react';

interface FloatingSpeedDialProps {
  onNavigateTab: (tabId: string) => void;
}

export default function FloatingSpeedDial({ onNavigateTab }: FloatingSpeedDialProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2.5">
        {/* Expanded Speed Dial Actions */}
        {isOpen && (
          <div className="flex flex-col items-end gap-2 animate-fade-in mb-1">

            <button
              onClick={() => {
                onNavigateTab('quick_actions');
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xl hover:border-cyan-500 transition group"
            >
              <span className="opacity-80 group-hover:opacity-100">Cấp Cứu Sự Cố Nhanh</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                <Zap className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => {
                onNavigateTab('diagnostics');
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xl hover:border-cyan-500 transition group"
            >
              <span className="opacity-80 group-hover:opacity-100">Soi Khóa CSDL Real-time</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => {
                onNavigateTab('weekly_report');
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xl hover:border-cyan-500 transition group"
            >
              <span className="opacity-80 group-hover:opacity-100">Soạn Báo Cáo Tuần IT</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => {
                setShowKeyboardHelp(true);
                setIsOpen(false);
              }}
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold shadow-xl hover:border-cyan-500 transition group"
            >
              <span className="opacity-80 group-hover:opacity-100">Phím Tắt Vận Hành</span>
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 flex items-center justify-center">
                <Keyboard className="w-4 h-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-13 h-13 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 ${
            isOpen
              ? 'bg-slate-900 text-white rotate-90 scale-105'
              : 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 text-white shadow-cyan-500/30 hover:scale-110 active:scale-95'
          }`}
          title="Thao Tác Cấp Tốc (Speed Dial)"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
        </button>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <Keyboard className="w-4 h-4 text-cyan-600" />
                <span>Bảng Phím Tắt Thần Tốc (IT Operations)</span>
              </div>
              <button onClick={() => setShowKeyboardHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Mở Command Palette:</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono text-[11px] font-bold">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Đến Cấp Cứu 1-Click:</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono text-[11px] font-bold">Ctrl + 1</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Đến AI Operations Copilot:</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono text-[11px] font-bold">Ctrl + 2</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Đến Diagnostics 360°:</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono text-[11px] font-bold">Ctrl + 4</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Đến Báo Cáo Tuần IT:</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono text-[11px] font-bold">Ctrl + 5</kbd>
              </div>
              <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Đến Console SQL & Ma Trận:</span>
                <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-800 border font-mono text-[11px] font-bold">Ctrl + 6</kbd>
              </div>
            </div>

            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs transition"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}
    </>
  );
}
