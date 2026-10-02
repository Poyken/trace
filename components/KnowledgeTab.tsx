'use client';

import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Monitor, 
  AlertOctagon, 
  Database, 
  FileText, 
  CheckCircle2, 
  ChevronRight, 
  Layers,
  Terminal,
  Play,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Download,
  Sparkles
} from 'lucide-react';
import { ScreenItem, PopErrorItem, DatabaseItem } from '@/lib/knowledge-hub';

export default function KnowledgeTab() {
  const [subSection, setSubSection] = useState<'screens' | 'pop_errors' | 'query' | 'databases'>('screens');
  const [search, setSearch] = useState('');

  const [screens, setScreens] = useState<ScreenItem[]>([]);
  const [popErrors, setPopErrors] = useState<PopErrorItem[]>([]);
  const [databases, setDatabases] = useState<DatabaseItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<ScreenItem | null>(null);

  // Safe Query Console states
  const [queryDb, setQueryDb] = useState('SmartFactoryV2');
  const [sqlText, setSqlText] = useState("SELECT TOP 50 LotID, RouteOrder, MachineCode, InTime, OutTime, GoodQty, NGQty\nFROM SmartFactoryV2.dbo.STB_ProdRouteHist WITH (NOLOCK)\nWHERE LotID = 'VVQR232R710618'\nORDER BY RouteOrder ASC;");
  const [queryExecuting, setQueryExecuting] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [queryResult, setQueryResult] = useState<{
    columns: string[];
    rows: any[];
    rowCount: number;
    elapsedMs: number;
  } | null>(null);
  const [copiedQuery, setCopiedQuery] = useState(false);

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

  const handleExecuteSafeQuery = async () => {
    setQueryExecuting(true);
    setQueryError(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlText, profile: queryDb })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setQueryResult({
          columns: data.columns || [],
          rows: data.rows || [],
          rowCount: data.rowCount || data.rows?.length || 0,
          elapsedMs: data.elapsedMs || 25
        });
      } else {
        setQueryError(data.error || 'Lỗi thực thi câu lệnh SQL');
      }
    } catch (e) {
      setQueryError((e as Error).message);
    } finally {
      setQueryExecuting(false);
    }
  };

  const handleExportCsv = () => {
    if (!queryResult || queryResult.rows.length === 0) return;
    let csv = '\uFEFF';
    csv += queryResult.columns.join(',') + '\n';
    queryResult.rows.forEach(r => {
      const line = queryResult.columns.map(c => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',');
      csv += line + '\n';
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${queryDb}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Sub-sections */}
      <div className="bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors duration-300">
        <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'screens', label: '97 Màn Hình MES (QUICK_MATRIX)', icon: Monitor },
            { id: 'pop_errors', label: '38 Mã Lỗi POP Kiosk (POP_MATRIX)', icon: AlertOctagon },
            { id: 'query', label: 'Console Truy Vấn CSDL (Safe Query)', icon: Terminal },
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
                  active
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input (For screens & pop_errors) */}
        {subSection !== 'query' && (
          <form onSubmit={handleSearchSubmit} className="flex w-full sm:w-auto items-center gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                subSection === 'screens' ? 'Tìm B530, B781, SP, bảng...' :
                subSection === 'pop_errors' ? 'Tìm POP-ERR-09, từ khóa...' : 'Tìm Database...'
              }
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono w-full sm:w-64 transition"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
            >
              <Search className="w-3.5 h-3.5" />
              Lọc
            </button>
          </form>
        )}
      </div>

      {/* SECTION 1: 97 SCREENS */}
      {subSection === 'screens' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden max-h-[700px] flex flex-col shadow-sm">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 flex justify-between">
              <span>Danh Sách Màn Hình ({screens.length})</span>
              <span className="text-cyan-600 dark:text-cyan-400 font-mono">WinForm NAIS MES</span>
            </div>
            <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 flex-1">
              {screens.map(screen => {
                const isSelected = selectedScreen?.id === screen.id;
                return (
                  <button
                    key={screen.id}
                    onClick={() => setSelectedScreen(screen)}
                    className={`w-full text-left p-3.5 transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-50 dark:bg-cyan-950/40 border-l-4 border-cyan-500 dark:border-cyan-400'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-700">
                          {screen.id}
                        </span>
                        <span className="text-xs text-slate-800 dark:text-slate-200 font-medium truncate max-w-[170px]">
                          {screen.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{screen.module}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {selectedScreen ? (
              <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-sm">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">{selectedScreen.id}</h3>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedScreen.name}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Phân hệ nghiệp vụ: <b className="text-cyan-600 dark:text-cyan-400">{selectedScreen.module}</b></p>
                  </div>
                  <span className="text-xs font-mono px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    Fix: {selectedScreen.fix_template || 'standard'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Stored Procedures Liên Quan</span>
                    <div className="space-y-1 font-mono text-xs">
                      <div><span className="text-slate-400">Get:</span> <b className="text-cyan-600 dark:text-cyan-400 break-all">{selectedScreen.sp_get || 'usp_vn_get' + selectedScreen.id}</b></div>
                      <div><span className="text-slate-400">IUD:</span> <b className="text-indigo-600 dark:text-indigo-400 break-all">{selectedScreen.sp_iud || 'usp_vn_set' + selectedScreen.id}</b></div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/80 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Bảng CSDL Cốt Lõi</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedScreen.tables.map(tbl => (
                        <span key={tbl} className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                          {tbl}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Các Lỗi Thường Gặp & Cách Khắc Phục (Ma Trận L1 Cache)
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(selectedScreen.common_bugs).map(([bug, fix]) => (
                      <div key={bug} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                        <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>{bug}</span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-xs text-slate-500 border border-dashed rounded-2xl">
                Chọn màn hình từ danh sách bên trái để xem chi tiết
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 2: 38 POP ERRORS */}
      {subSection === 'pop_errors' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hiển thị <b>{popErrors.length}</b> mã lỗi chuẩn từ ma trận vận hành <b>POP_MATRIX.json</b>:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {popErrors.map(err => (
              <div key={err.code} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                    {err.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[280px]">
                    {err.title}
                  </span>
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                  <span className="text-slate-500 font-semibold block">Nguyên nhân gốc rễ:</span>
                  <p className="leading-relaxed text-[11px]">{err.root_cause}</p>
                </div>
                <div className="text-xs text-cyan-800 dark:text-cyan-400 bg-slate-50 dark:bg-slate-950/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-[11px] break-all">
                  <span className="text-slate-500 font-sans block mb-1">Cách khắc phục nhanh:</span>
                  {err.fast_fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: SAFE SQL QUERY CONSOLE */}
      {subSection === 'query' && (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  Console Truy Vấn CSDL Trực Quan (Rule 1: SELECT-Only Safe Mode)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tự động áp dụng <code className="text-cyan-600 dark:text-cyan-400 font-mono">WITH (NOLOCK)</code> để chống khóa bảng chuyền xưởng.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={queryDb}
                  onChange={(e) => setQueryDb(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 outline-none focus:border-cyan-500 transition"
                >
                  <option value="SmartFactoryV2">SmartFactoryV2 (MES Core)</option>
                  <option value="VINATECH_POP">VINATECH_POP (Kiosk & Mongo)</option>
                  <option value="NeoE_VINA">NeoE_VINA (ERP Cốt Lõi)</option>
                  <option value="Bizbox_GW">Bizbox_GW (Groupware)</option>
                  <option value="SmartFramework">SmartFramework (Users & Menu)</option>
                </select>

                <button
                  onClick={handleExecuteSafeQuery}
                  disabled={queryExecuting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl transition shadow-md shadow-cyan-600/20 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{queryExecuting ? 'Đang chạy...' : 'Chạy SQL'}</span>
                </button>
              </div>
            </div>

            {/* Quick SQL Presets Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
              <span className="text-slate-400 font-sans mr-1 shrink-0">Mẫu truy vấn nhanh:</span>
              {[
                {
                  label: 'Top 20 Lot MES mới nhất',
                  db: 'SmartFactoryV2',
                  sql: "SELECT TOP 20 LotID, RouteOrder, MachineCode, InTime, OutTime, GoodQty, NGQty\nFROM SmartFactoryV2.dbo.STB_ProdRouteHist WITH (NOLOCK)\nORDER BY InTime DESC;"
                },
                {
                  label: 'Thiết Bị Kẹt Khóa ACTIVE',
                  db: 'VINATECH_POP',
                  sql: "SELECT TOP 50 MAPPING_ID, DAY_PLAN_NO, LINE_CODE, ROUTE_CODE, EQUIPMENT_ID, EQUIPMENT_NAME, MAPPING_STATUS, MAPPED_AT\nFROM VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING WITH (NOLOCK)\nWHERE MAPPING_STATUS IN ('ACTIVE', 'AUTO_MAPPED')\nORDER BY MAPPED_AT DESC;"
                },
                {
                  label: 'Kẹt Pipeline MongoToMes',
                  db: 'SmartFactoryV2',
                  sql: "SELECT TOP 50 Barcode, DayPlanNo, MachineCode, RouteCode, TotalProdQty, IsDone, IsTransferred, RegDate\nFROM SmartFactoryV2.dbo.MongoToMesPerformance WITH (NOLOCK)\nWHERE IsDone = 1 AND IsTransferred = 0\nORDER BY RegDate DESC;"
                },
                {
                  label: 'Tồn Kho Xưởng ROUTE_VN_WH',
                  db: 'SmartFactoryV2',
                  sql: "SELECT TOP 50 LotID, MaterialCode, CurrentQty, WarehouseCode, Status\nFROM SmartFactoryV2.dbo.STB_MaterialLotInfo WITH (NOLOCK)\nWHERE WarehouseCode = 'ROUTE_VN_WH'\nORDER BY ChangeDate DESC;"
                },
                {
                  label: 'Nhân Viên Kiosk VINA_EMP',
                  db: 'VINATECH_POP',
                  sql: "SELECT TOP 50 NO_EMP, NM_KOR, NM_ENG, CD_DUTY_RESP, IS_STOPPED, EMP_ADMIN\nFROM VINATECH_POP.dbo.VINA_EMP WITH (NOLOCK)\nWHERE IS_STOPPED = 'N';"
                }
              ].map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQueryDb(p.db);
                    setSqlText(p.sql);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/60 hover:text-cyan-600 dark:hover:text-cyan-300 border border-slate-200 dark:border-slate-700 whitespace-nowrap font-medium transition"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* SQL Textarea */}
            <div className="relative">
              <textarea
                value={sqlText}
                onChange={(e) => setSqlText(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 text-slate-100 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:border-cyan-500 outline-none leading-relaxed resize-y"
              />
            </div>

            {queryError && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{queryError}</span>
              </div>
            )}
          </div>

          {/* Results Viewer */}
          {queryResult && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm space-y-0">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950/60">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Kết Quả Truy Vấn ({queryResult.rowCount} dòng, {queryResult.elapsedMs}ms)</span>
                </div>
                <button
                  onClick={handleExportCsv}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100/90 dark:bg-slate-950/90 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 sticky top-0">
                    <tr>
                      {queryResult.columns.map(col => (
                        <th key={col} className="p-3 whitespace-nowrap font-mono">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {queryResult.rows.map((r, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        {queryResult.columns.map(col => (
                          <td key={col} className="p-3 whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {r[col] !== null && r[col] !== undefined ? String(r[col]) : <i className="text-slate-400">NULL</i>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 4: 15 DATABASES */}
      {subSection === 'databases' && (
        <div className="space-y-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Hạ tầng CSDL Vinatech: <b>{databases.length}</b> cơ sở dữ liệu trên máy chủ <b>dbserver.hycap.co.kr,5398</b>:
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {databases.map(db => (
              <div key={db.profile} className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 shadow-sm transition">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">{db.name}</h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300">
                    Profile: {db.profile}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{db.role}</p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-2 border-t border-slate-200 dark:border-slate-800/80">
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block font-sans">Bảng</span>
                    <span className="font-bold text-cyan-600 dark:text-cyan-400">{db.tablesCount}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block font-sans">Views</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{db.viewsCount}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    <span className="text-slate-500 text-[10px] block font-sans">SPs</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{db.spCount}</span>
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
