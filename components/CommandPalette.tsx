'use client';

import React, { useState, useEffect } from 'react';
import { Search, Monitor, AlertTriangle, Layers, Wrench, X, ArrowRight, CornerDownLeft } from 'lucide-react';
import { ScreenItem, PopErrorItem } from '@/lib/knowledge-hub';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (type: string, payload: string) => void;
}

export default function CommandPalette({ isOpen, onClose, onSelectAction }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [screens, setScreens] = useState<ScreenItem[]>([]);
  const [popErrors, setPopErrors] = useState<PopErrorItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/screens')
        .then(res => res.json())
        .then(data => setScreens(data.screens || []))
        .catch(err => console.warn('Screens fetch error:', err));
      fetch('/api/pop-errors')
        .then(res => res.json())
        .then(data => setPopErrors(data.errors || []))
        .catch(err => console.warn('Pop-errors fetch error:', err));
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const filteredScreens = screens.filter(s =>
    s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  ).slice(0, 5);

  const filteredErrors = popErrors.filter(e =>
    e.code.toLowerCase().includes(q) || e.title.toLowerCase().includes(q)
  ).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 dark:bg-black/80 backdrop-blur-md animate-fade-in p-4">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-transparent">
          <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mr-3 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm nhanh màn hình (B530, B781), mã lỗi (POP-ERR-09), Lot (VVQR...)..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none font-mono"
          />
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {query.length > 0 && (
            <div
              onClick={() => {
                onSelectAction('trace', query);
                onClose();
              }}
              className="flex items-center justify-between p-2.5 rounded-xl hover:bg-cyan-50 dark:hover:bg-cyan-950/60 hover:border-cyan-200 dark:hover:border-cyan-800/80 border border-transparent cursor-pointer transition text-xs"
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span className="text-slate-800 dark:text-slate-200">Truy vết 360° đối tượng: <b className="text-cyan-700 dark:text-cyan-300 font-mono">&quot;{query}&quot;</b></span>
              </div>
              <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
            </div>
          )}

          {/* Screens Section */}
          {filteredScreens.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3 tracking-wider">Màn Hình MES WinForm (97 Màn Hình)</span>
              {filteredScreens.map(s => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectAction('screen', s.id);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <Monitor className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <span className="font-mono font-bold text-cyan-700 dark:text-cyan-300 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">{s.id}</span>
                    <span className="text-slate-800 dark:text-slate-300 font-medium">{s.name}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition" />
                </div>
              ))}
            </div>
          )}

          {/* POP Errors Section */}
          {filteredErrors.length > 0 && (
            <div className="pt-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase px-3 tracking-wider">Mã Lỗi POP Kiosk (38 Mã Lỗi)</span>
              {filteredErrors.map(e => (
                <div
                  key={e.code}
                  onClick={() => {
                    onSelectAction('pop_error', e.code);
                    onClose();
                  }}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 cursor-pointer transition text-xs group"
                >
                  <div className="flex items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="font-mono font-bold text-rose-700 dark:text-rose-300 px-1.5 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800">{e.code}</span>
                    <span className="text-slate-800 dark:text-slate-300 font-medium truncate max-w-[340px]">{e.title}</span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition" />
                </div>
              ))}
            </div>
          )}

          {query.length === 0 && (
            <div className="p-6 text-center text-slate-500 text-xs">
              Gõ mã bất kỳ để điều hướng nhanh: <code className="text-cyan-600 dark:text-cyan-400 font-mono">B530</code>, <code className="text-cyan-600 dark:text-cyan-400 font-mono">POP-ERR-09</code>, <code className="text-cyan-600 dark:text-cyan-400 font-mono">VVQR...</code>, <code className="text-cyan-600 dark:text-cyan-400 font-mono">92603003</code>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500">
          <span>Điều hướng bằng chuột hoặc phím Enter</span>
          <span className="font-mono bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-700 dark:text-slate-400">ESC để đóng</span>
        </div>
      </div>
    </div>
  );
}
