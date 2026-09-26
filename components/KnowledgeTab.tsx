'use client';

import React, { useEffect, useState } from 'react';
import { BookOpen, Search, Monitor, AlertOctagon, Database, FileText, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { ScreenItem, PopErrorItem, DatabaseItem } from '@/lib/knowledge-hub';

export default function KnowledgeTab() {
  const [subSection, setSubSection] = useState<'screens' | 'pop_errors' | 'databases'>('screens');
  const [search, setSearch] = useState('');

  const [screens, setScreens] = useState<ScreenItem[]>([]);
  const [popErrors, setPopErrors] = useState<PopErrorItem[]>([]);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<ScreenItem | null>(null);

  useEffect(() => {
    fetchData();
  }, [subSection]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (subSection === 'screens') {
        const res = await fetch(`/api/screens?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setScreens(data.screens);
          if (data.screens.length > 0 && !selectedScreen) {
            setSelectedScreen(data.screens[0]);
          }
        }
      } else if (subSection === 'pop_errors') {
        const res = await fetch(`/api/pop-errors?q=${encodeURIComponent(search)}`);
        if (res.ok) {
          const data = await res.json();
          setPopErrors(data.errors);
        }
      } else if (subSection === 'databases') {
        const res = await fetch('/api/databases');
        if (res.ok) {
          const data = await res.json();
          setDatabases(data.databases);
        }
      }
    } catch {
      // Keep
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Sub-sections */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex space-x-2">
          {[
            { id: 'screens', label: '97 Màn Hình MES (QUICK_MATRIX)', icon: Monitor },
            { id: 'pop_errors', label: '38 Mã Lỗi POP Kiosk (POP_MATRIX)', icon: AlertOctagon },
            { id: 'databases', label: '15 Cơ Sở Dữ Liệu (Multi-DB)', icon: Database }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubSection(tab.id as any);
                  setSearch('');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                  active
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-auto items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              subSection === 'screens' ? 'Tìm B530, B781, SP, bảng...' :
              subSection === 'pop_errors' ? 'Tìm POP-ERR-09, từ khóa...' : 'Tìm Database...'
            }
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono w-64"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs rounded-lg border border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5" />
            Lọc
          </button>
        </form>
      </div>

      {/* SECTION 1: 97 SCREENS */}
      {subSection === 'screens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left list of screens */}
          <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden max-h-[700px] flex flex-col">
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs font-semibold text-slate-400 flex justify-between">
              <span>Danh Sách Màn Hình ({screens.length})</span>
              <span className="text-cyan-400 font-mono">WinForm NAIS MES</span>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-800/60 flex-1">
              {screens.map(screen => {
                const isSelected = selectedScreen?.id === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setSelectedScreen(screen)}
                    className={`w-full text-left p-3.5 transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                          {screen.id}
                        </span>
                        <span className="text-xs text-slate-200 font-medium truncate max-w-[170px]">
                          {screen.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 truncate max-w-[230px]">
                        Module: {screen.module} • {screen.tables.length} bảng
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right screen detail view */}
          <div className="lg:col-span-2 space-y-4">
            {selectedScreen ? (
              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
                <div className="flex justify-between items-start border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold font-mono text-cyan-400 px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800">
                        {selectedScreen.id}
                      </span>
                      <div>
                        <h3 className="text-lg font-bold text-white">{selectedScreen.name}</h3>
                        <span className="text-xs text-slate-400">Phân hệ: {selectedScreen.module}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stored Procedures & Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
                    <span className="text-slate-400 font-sans font-semibold">Stored Procedure Đọc (GET):</span>
                    <div className="text-cyan-300 break-all">{selectedScreen.sp_get || 'Không định nghĩa'}</div>
                    <span className="text-slate-400 font-sans font-semibold block pt-2">Stored Procedure Ghi (IUD):</span>
                    <div className="text-emerald-400 break-all">{selectedScreen.sp_iud || 'Không định nghĩa'}</div>
                  </div>

                  <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-slate-400 font-sans font-semibold">Bảng Dữ Liệu Liên Quan:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedScreen.tables.map(t => (
                        <span key={t} className="px-2 py-1 rounded bg-slate-900 text-slate-300 border border-slate-800 text-[11px]">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Common Bugs & Troubleshooting */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Sự Cố Thường Gặp & Cách Khắc Phục (Knowledge Base):
                  </h4>
                  {Object.keys(selectedScreen.common_bugs).length === 0 ? (
                    <p className="text-xs text-slate-500 italic">Chưa ghi nhận sự cố đặc thù cho màn hình này.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {Object.entries(selectedScreen.common_bugs).map(([k, v], idx) => (
                        <div key={idx} className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs space-y-1">
                          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {k.replace(/_/g, ' ')}
                          </div>
                          <div className="text-slate-300 text-[11px] leading-relaxed pl-3" dangerouslySetInnerHTML={{ __html: v }} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Fix Template */}
                {selectedScreen.fix_template && (
                  <div className="p-3 bg-cyan-950/20 border border-cyan-900/60 rounded-xl text-xs space-y-1">
                    <span className="font-semibold text-cyan-400">Gợi Ý Mẫu Khắc Phục (Fix Template):</span>
                    <p className="text-slate-300 font-mono text-[11px]">{selectedScreen.fix_template}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-sm">
                Chọn một màn hình từ danh sách bên trái để xem chi tiết.
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: 38 POP ERRORS */}
      {subSection === 'pop_errors' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-400">
            Hiển thị <b>{popErrors.length}</b> mã lỗi Kiosk chuẩn hóa trong Ma Trận L1 Cache POP_MATRIX:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popErrors.map(err => (
              <div key={err.code} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                    {err.code}
                  </span>
                  <span className="text-xs font-semibold text-white truncate max-w-[280px]">
                    {err.title}
                  </span>
                </div>
                <div className="text-xs text-slate-300 space-y-1">
                  <span className="text-slate-500 font-semibold block">Nguyên nhân gốc rễ:</span>
                  <p className="leading-relaxed text-[11px]">{err.root_cause}</p>
                </div>
                <div className="text-xs text-cyan-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] break-all">
                  <span className="text-slate-500 font-sans block mb-1">Cách khắc phục nhanh:</span>
                  {err.fast_fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: 15 DATABASES */}
      {subSection === 'databases' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-400">
            Hạ tầng CSDL Vinatech: <b>{databases.length}</b> cơ sở dữ liệu trên máy chủ <b>dbserver.hycap.co.kr,5398</b>:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {databases.map(db => (
              <div key={db.profile} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-white text-sm">{db.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                    Profile: {db.profile}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{db.role}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div className="bg-slate-950 p-2 rounded">
                    <span className="text-slate-500 text-[10px] block font-sans">Bảng</span>
                    <span className="font-bold text-cyan-400">{db.tablesCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded">
                    <span className="text-slate-500 text-[10px] block font-sans">Views</span>
                    <span className="font-bold text-indigo-400">{db.viewsCount}</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded">
                    <span className="text-slate-500 text-[10px] block font-sans">SPs</span>
                    <span className="font-bold text-emerald-400">{db.spCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
