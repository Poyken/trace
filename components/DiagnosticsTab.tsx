'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Layers, 
  Box, 
  Tag, 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Check, 
  Sparkles,
  GitFork,
  Lock,
  RefreshCw,
  Database,
  Terminal,
  FileCode2,
  ChevronRight,
  ShieldAlert,
  Copy
} from 'lucide-react';
import { TraceResult, UserInspectionResult, PackInspectionResult, LineageResult, DbLocksResult } from '@/lib/types';

interface DiagnosticsTabProps {
  initialType?: string;
  initialTarget?: string;
  onNavigateTab?: (tab: string, target?: string) => void;
}

function EmptyStateCard({
  icon: Icon,
  title,
  description,
  samples,
  onSelectSample
}: {
  icon: any;
  title: string;
  description: string;
  samples: { label: string; value: string }[];
  onSelectSample: (val: string) => void;
}) {
  return (
    <div className="glass-panel rounded-2xl p-8 text-center space-y-4 max-w-2xl mx-auto my-6 border border-slate-200 dark:border-slate-800/80 shadow-sm animate-fade-in">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/60 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner">
        <Icon className="w-7 h-7" />
      </div>
      <div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">{description}</p>
      </div>
      <div className="pt-2">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
          Gợi ý tra cứu nhanh (1-Click):
        </span>
        <div className="flex flex-wrap justify-center gap-2">
          {samples.map((s) => (
            <button
              key={s.value}
              onClick={() => onSelectSample(s.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-cyan-50 dark:bg-slate-800/70 dark:hover:bg-cyan-950/50 border border-slate-200 dark:border-slate-700/80 hover:border-cyan-400 dark:hover:border-cyan-600 text-slate-700 dark:text-slate-300 hover:text-cyan-700 dark:hover:text-cyan-300 text-xs font-mono transition flex items-center gap-1.5 shadow-sm"
            >
              <span>{s.label}:</span>
              <span className="font-bold">{s.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DiagnosticsTab({ initialType = 'trace', initialTarget = '', onNavigateTab }: DiagnosticsTabProps) {
  const [subTab, setSubTab] = useState<'trace' | 'lineage' | 'locks' | 'bom' | 'pack' | 'user'>(
    (initialType as any) || 'trace'
  );
  const [query, setQuery] = useState(initialTarget || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

  // Results
  const [traceData, setTraceData] = useState<TraceResult | null>(null);
  const [lineageData, setLineageData] = useState<LineageResult | null>(null);
  const [locksData, setLocksData] = useState<DbLocksResult | null>(null);
  const [selectedLockProfile, setSelectedLockProfile] = useState<string>('SmartFactoryV2');
  const [autoRefreshLocks, setAutoRefreshLocks] = useState<boolean>(false);
  const [isSimulatingLock, setIsSimulatingLock] = useState<boolean>(false);
  const [packData, setPackData] = useState<PackInspectionResult | null>(null);
  const [userData, setUserData] = useState<UserInspectionResult | null>(null);

  const handleSearch = async (targetOverride?: string) => {
    const targetToQuery = (targetOverride !== undefined ? targetOverride : query).trim();
    if (!targetToQuery && subTab !== 'locks') return;
    if (targetOverride !== undefined) {
      setQuery(targetOverride);
    }
    setLoading(true);
    setError(null);

    try {
      if (subTab === 'trace' || subTab === 'bom') {
        const res = await fetch(`/api/trace?target=${encodeURIComponent(targetToQuery)}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        const data = await res.json();
        setTraceData(data);
        setSelectedRouteIdx(data.routeHistory?.length - 1 || 0);
      } else if (subTab === 'lineage') {
        const res = await fetch(`/api/lineage?target=${encodeURIComponent(targetToQuery)}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        setLineageData(await res.json());
      } else if (subTab === 'locks') {
        const res = await fetch(`/api/locks?profile=${encodeURIComponent(selectedLockProfile)}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi kiểm tra khóa');
        setLocksData(await res.json());
      } else if (subTab === 'pack') {
        const res = await fetch(`/api/pack?target=${encodeURIComponent(targetToQuery)}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        setPackData(await res.json());
      } else if (subTab === 'user') {
        const res = await fetch(`/api/user?target=${encodeURIComponent(targetToQuery)}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        setUserData(await res.json());
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Only auto-search for 'locks' when on locks subtab, or when explicit initialTarget is passed
  useEffect(() => {
    if (subTab === 'locks') {
      handleSearch();
    }
  }, [subTab, selectedLockProfile]);

  useEffect(() => {
    if (initialTarget && initialTarget.trim()) {
      setQuery(initialTarget.trim());
      handleSearch(initialTarget.trim());
    }
  }, [initialTarget]);

  // Auto-refresh locks
  useEffect(() => {
    let interval: any;
    if (subTab === 'locks' && autoRefreshLocks) {
      interval = setInterval(() => {
        handleSearch();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [subTab, autoRefreshLocks, selectedLockProfile]);

  const databaseProfiles = [
    'SmartFactoryV2',
    'VINATECH_POP',
    'NeoE_VINA',
    'Bizbox_GW',
    'SmartFramework',
    'VINATECH_ANDON'
  ];

  return (
    <div className="space-y-6">
      {/* Sub-tab selection bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <div className="flex space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'trace', label: 'Trace 360° (Lot & PO)', icon: Layers },
            { id: 'lineage', label: 'Huyết Mạch (Lineage)', icon: GitFork },
            { id: 'locks', label: 'Soi Khóa Real-Time', icon: Lock },
            { id: 'bom', label: 'BOM & Tồn Kho', icon: Box },
            { id: 'pack', label: 'Đóng Thùng & Pack', icon: Tag },
            { id: 'user', label: 'Nhân Sự & Quyền', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubTab(tab.id as any);
                  setError(null);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/25 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input Box / Controls */}
        {subTab === 'locks' ? (
          <div className="flex w-full sm:w-auto items-center gap-2">
            <select
              value={selectedLockProfile}
              onChange={(e) => setSelectedLockProfile(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 outline-none focus:border-cyan-500 transition"
            >
              {databaseProfiles.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            <button
              onClick={() => setAutoRefreshLocks(!autoRefreshLocks)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                autoRefreshLocks
                  ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${autoRefreshLocks ? 'animate-spin' : ''}`} />
              <span>{autoRefreshLocks ? 'Tự Động 5s' : 'Bật Auto'}</span>
            </button>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium text-xs rounded-xl shadow-md shadow-cyan-600/20 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Quét Khóa
            </button>

            <button
              onClick={() => {
                if (isSimulatingLock) {
                  setIsSimulatingLock(false);
                  handleSearch();
                } else {
                  setIsSimulatingLock(true);
                  setLocksData({
                    profile: selectedLockProfile,
                    totalConnections: 45,
                    activeLocksCount: 2,
                    blockingChainsCount: 1,
                    locks: [
                      {
                        spid: 84,
                        blockedBySpid: 92,
                        waitTimeSeconds: 142,
                        waitType: 'LCK_M_X',
                        dbName: selectedLockProfile,
                        hostName: 'HY-MES-AP01',
                        programName: 'NAIS MES WinForm (B530)',
                        loginName: 'sa_sfv2',
                        sqlText: "UPDATE H SET H.ProdDateTime = GETDATE() FROM SmartFactoryV2.dbo.STB_ProdRouteHist H INNER JOIN SmartFactoryV2.dbo.STB_SetInfo S ON H.ControlNo = S.ControlNo WHERE S.Barcode = 'VVQR232R710618'",
                        status: 'WAITING'
                      },
                      {
                        spid: 92,
                        blockedBySpid: 0,
                        waitTimeSeconds: 0,
                        waitType: 'MISCELLANEOUS',
                        dbName: selectedLockProfile,
                        hostName: 'KIOSK-WIND-03',
                        programName: 'Chrome / Kiosk POP Web',
                        loginName: 'sa_pop',
                        sqlText: "BEGIN TRAN; UPDATE VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING SET MAPPING_STATUS='ACTIVE' WHERE EQUIPMENT_ID='VVMHY130'...",
                        status: 'BLOCKING'
                      }
                    ],
                    timestamp: new Date().toISOString()
                  });
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition ${
                isSimulatingLock
                  ? 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
              title="Mô phỏng tình huống khóa blocking để kiểm thử giao diện cảnh báo"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
              <span>{isSimulatingLock ? 'Hủy Thử' : 'Thử Khóa'}</span>
            </button>
          </div>
        ) : (
          <div className="flex w-full sm:w-auto items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={
                subTab === 'user' ? 'Nhập mã NV (32605098, 92603003)...' :
                subTab === 'pack' ? 'Nhập mã PKQS... hoặc Lot...' :
                subTab === 'lineage' ? 'Nhập Lot (VVQR...) hoặc PO (12 số)...' :
                subTab === 'bom' ? 'Nhập Lot để soi định mức BOM...' :
                'Nhập mã Lot (VVQR...) hoặc PO...'
              }
              className="bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono w-full sm:w-72 transition"
            />
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              {loading ? 'Đang soi...' : 'Tra cứu'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-sm rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading && (
        <div className="glass-panel rounded-2xl p-8 text-center space-y-3 animate-fade-in border border-cyan-500/20">
          <div className="w-9 h-9 mx-auto rounded-xl bg-cyan-100 dark:bg-cyan-950/80 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
            Đang chẩn đoán dữ liệu thời gian thực từ CSDL Vinatech...
          </p>
        </div>
      )}

      {/* SUBTAB 1: TRACE 360° */}
      {subTab === 'trace' && (traceData ? (
        <div className="space-y-6 animate-fade-in">
          {/* Header Lot Summary Card */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap justify-between items-center gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Đối Tượng Truy Vết 360° (Single Round-Trip)
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">{traceData.target}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide border ${
                    traceData.missingStandardRoutes && traceData.missingStandardRoutes.length > 0
                      ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 animate-pulse'
                      : 'bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400'
                  }`}>
                    {traceData.missingStandardRoutes && traceData.missingStandardRoutes.length > 0
                      ? 'LỖI ĐỊNH TUYẾN PO'
                      : traceData.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 font-sans block text-[11px]">Model Sản Phẩm</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 truncate block">{traceData.modelCode}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 font-sans block text-[11px]">Lệnh Sản Xuất (PO)</span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 truncate block">{traceData.poCode || 'Chưa liên kết'}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 font-sans block text-[11px]">Dây Chuyền (Line)</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400 truncate block">{traceData.line}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  <span className="text-slate-500 font-sans block text-[11px]">Đóng Thùng / Pack</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 truncate block">{traceData.packingInfo?.packingId || 'Chưa đóng gói'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* KHUNG CẢNH BÁO ĐỎ NỔI BẬT: PHÁT HIỆN THIẾU CÔNG ĐOẠN CHUẨN (PO ROUTING MISMATCH) */}
          {traceData.missingStandardRoutes && traceData.missingStandardRoutes.length > 0 && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-500/15 via-rose-500/10 to-amber-500/10 border-2 border-rose-500/80 dark:border-rose-500 shadow-xl shadow-rose-500/10 space-y-4 animate-fade-in relative overflow-hidden">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/30 animate-pulse">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <span>CẢNH BÁO NGUY CƠ NHẢY CÓC CÔNG ĐOẠN (PO ROUTING MISMATCH)</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-600 text-white font-mono font-bold">
                        CRITICAL
                      </span>
                    </h4>
                    <p className="text-xs text-rose-900 dark:text-rose-200 mt-1 max-w-2xl leading-relaxed">
                      Lệnh sản xuất <b>PO: {traceData.poCode}</b> có cấu hình định tuyến trong <code className="bg-rose-100 dark:bg-rose-950 px-1 py-0.5 rounded font-mono font-bold">STB_ProductionOrderRouting</code> bị thiếu <b>{traceData.missingStandardRoutes.length} công đoạn chuẩn</b> so với Model Master (<code className="font-mono">{traceData.basicRoutingCode || 'MainRoutingRubAging'}</code>).
                    </p>
                  </div>
                </div>

                {onNavigateTab && (
                  <button
                    onClick={() => onNavigateTab('hotfix')}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Tạo Hotfix Bổ Sung Aging PO</span>
                  </button>
                )}
              </div>

              {/* Danh sách các công đoạn bị thiếu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {traceData.missingStandardRoutes.map((mRoute) => (
                  <div
                    key={mRoute.routeCode}
                    className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/90 border border-rose-300 dark:border-rose-800/80 shadow-sm flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
                        <span className="w-5 h-5 rounded-md bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 flex items-center justify-center font-mono text-[10px]">
                          {mRoute.routeIndex}
                        </span>
                        <span>{mRoute.routeName}</span>
                        <code className="text-rose-600 dark:text-rose-400 font-mono text-[11px] font-bold">({mRoute.routeCode})</code>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-sans">
                        Vị trí chuẩn: Bước thứ {mRoute.routeIndex} trong quy trình {traceData.basicRoutingName || traceData.basicRoutingCode}.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-bold font-mono border border-rose-300 dark:border-rose-800">
                      BỊ BỎ QUA
                    </span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-rose-100/60 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-[11px] text-rose-800 dark:text-rose-300 leading-relaxed font-sans">
                💡 <b>Hậu quả tại xưởng:</b> Kiosk POP đọc định tuyến trực tiếp từ Lệnh SX PO. Khi công nhân chốt xong công đoạn bọc vỏ (<code className="font-mono font-bold">V-25_HY</code>), Kiosk sẽ <b>nhảy cóc thẳng sang Ngoại quan (<code className="font-mono font-bold">V-27_HY</code>)</b>, bỏ qua hoàn toàn công đoạn Lão hóa nhiệt (<code className="font-mono font-bold">V-26_HY Aging</code>), dẫn đến nguy cơ xuất xưởng hàng chưa test độ ổn định điện áp!
              </div>
            </div>
          )}

          {/* SƠ ĐỒ TIẾN TRÌNH CÔNG NGHỆ (VISUAL PROCESS STEPPER) */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  Sơ Đồ Tiến Trình Chuyển Tuyến Công Nghệ (Visual Process Stepper)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Đối chiếu giữa Lịch sử thực tế (ProdRouteHist) và Định tuyến Lệnh SX (STB_ProductionOrderRouting)
                </p>
              </div>
              <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Đã chốt MES</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span> Đang chờ POP</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700"></span> Chưa tới</span>
              </div>
            </div>

            {/* Stepper Pipeline */}
            <div className="relative pt-3 pb-4 overflow-x-auto">
              <div className="flex items-center min-w-[760px] justify-between relative px-4">
                <div className="absolute top-8 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-800 z-0">
                  <div className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-amber-500 w-3/4 rounded" />
                </div>

                {/* Render các bước từ poRouting hoặc routeHistory */}
                {(traceData.poRouting && traceData.poRouting.length > 0 ? traceData.poRouting : traceData.routeHistory.map((r, i) => ({
                  routeIndex: i + 1,
                  routeCode: r.routeName.split(' ')[0],
                  routeName: r.routeName,
                  isInputRoute: i === 0,
                  isOutputRoute: i === traceData.routeHistory.length - 1
                }))).map((route, idx) => {
                  const completedHist = traceData.routeHistory.find(h => h.routeName.includes(route.routeCode) || (route.routeCode && h.machineCode && h.routeName.includes(route.routeCode)));
                  const isCompleted = !!completedHist;
                  const isCurrent = !isCompleted && idx === traceData.routeHistory.length;
                  const isSelected = selectedRouteIdx === idx;

                  return (
                    <div
                      key={route.routeCode + '-' + idx}
                      onClick={() => setSelectedRouteIdx(idx)}
                      className="flex flex-col items-center relative z-10 cursor-pointer group"
                    >
                      <div
                        className={`w-11 h-11 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all shadow-md ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/40 scale-110'
                            : isCompleted
                            ? 'bg-emerald-500 text-white ring-2 ring-emerald-400 hover:scale-105'
                            : isCurrent
                            ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-400/40 animate-pulse'
                            : 'bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-cyan-500'
                        }`}
                      >
                        {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : route.routeIndex}
                      </div>

                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 mt-2 text-center max-w-[110px] truncate group-hover:text-cyan-600 transition">
                        {route.routeName.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                        {route.routeCode}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full mt-1 ${
                        isCompleted
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : isCurrent
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                      }`}>
                        {isCompleted ? 'ĐÃ CHỐT' : isCurrent ? 'ĐANG CHỜ' : 'CHƯA TỚI'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Route Info Box */}
            {traceData.routeHistory[selectedRouteIdx] ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 font-sans">Công đoạn đã chọn:</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].routeName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Thiết bị / Kiosk:</span>
                  <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].machineCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Công nhân chốt:</span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].workerId}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">SL Đạt / Phế:</span>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].goodQty.toLocaleString()} / <span className="text-rose-600 dark:text-rose-400">{traceData.routeHistory[selectedRouteIdx].ngQty}</span> EA
                  </div>
                </div>
              </div>
            ) : traceData.poRouting && traceData.poRouting[selectedRouteIdx] ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 font-sans">Công đoạn PO:</span>
                  <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {traceData.poRouting[selectedRouteIdx].routeName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Mã RouteCode:</span>
                  <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {traceData.poRouting[selectedRouteIdx].routeCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Người sửa PO:</span>
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {traceData.poRouting[selectedRouteIdx].changeUser || 'Hệ thống'}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Trạng thái:</span>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    Chưa chốt trên MES WinForm
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* BẢNG 1: CẤU HÌNH ĐỊNH TUYẾN LỆNH SẢN XUẤT (PO ROUTING) */}
          {traceData.poRouting && traceData.poRouting.length > 0 && (
            <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/40">
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cấu Hình Định Tuyến Lệnh Sản Xuất (<code className="font-mono text-indigo-600 dark:text-indigo-400">STB_ProductionOrderRouting</code>)
                  </h4>
                </div>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  PO: <b className="text-slate-800 dark:text-slate-200">{traceData.poCode}</b> ({traceData.poRouting.length} công đoạn)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4">Thứ Tự</th>
                      <th className="py-2.5 px-4">Mã Công Đoạn</th>
                      <th className="py-2.5 px-4">Tên Công Đoạn</th>
                      <th className="py-2.5 px-4">Điểm Vào/Ra</th>
                      <th className="py-2.5 px-4">Tiến Độ Thực Tế</th>
                      <th className="py-2.5 px-4">Người Sửa Cuối</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {traceData.poRouting.map((pRoute) => {
                      const completedHist = traceData.routeHistory.find(h => h.routeName.includes(pRoute.routeCode));
                      return (
                        <tr key={pRoute.routeIndex} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            #{pRoute.routeIndex}
                          </td>
                          <td className="py-2.5 px-4 text-cyan-600 dark:text-cyan-400 font-bold">
                            {pRoute.routeCode}
                          </td>
                          <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-slate-200">
                            {pRoute.routeName}
                          </td>
                          <td className="py-2.5 px-4">
                            {pRoute.isInputRoute ? (
                              <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                Input
                              </span>
                            ) : pRoute.isOutputRoute ? (
                              <span className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold">
                                Output
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">-</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4">
                            {completedHist ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 w-fit">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Đã chốt MES ({completedHist.goodQty} EA)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold flex items-center gap-1 w-fit">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Đang chờ chốt
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                            {pRoute.changeUser || 'Hệ thống'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* BẢNG 2: LỊCH SỬ SẢN XUẤT THỰC TẾ (MES WINFORM & KIOSK POP) */}
          <div className="bg-white dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/40">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Lịch Sử Sản Xuất Đã Chốt (<code className="font-mono text-cyan-600 dark:text-cyan-400">STB_ProdRouteHist</code>)
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                {traceData.routeHistory.length} công đoạn đã qua
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4">Bước</th>
                    <th className="py-2.5 px-4">Tên Công Đoạn</th>
                    <th className="py-2.5 px-4">Thiết Bị / Kiosk</th>
                    <th className="py-2.5 px-4">Công Nhân</th>
                    <th className="py-2.5 px-4">Thời Gian Hoàn Tất</th>
                    <th className="py-2.5 px-4">SL Đạt</th>
                    <th className="py-2.5 px-4">SL Phế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                  {traceData.routeHistory.map((item) => (
                    <tr key={item.routeOrder} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                        #{item.routeOrder}
                      </td>
                      <td className="py-2.5 px-4 font-sans font-medium text-slate-900 dark:text-slate-200">
                        {item.routeName}
                      </td>
                      <td className="py-2.5 px-4 text-cyan-600 dark:text-cyan-400 font-bold">
                        {item.machineCode}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                        {item.workerId}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 dark:text-slate-400">
                        {item.outTime}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                        {item.goodQty.toLocaleString()} EA
                      </td>
                      <td className="py-2.5 px-4 text-rose-600 dark:text-rose-400 font-bold">
                        {item.ngQty} EA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RAW CLI OUTPUT (Tùy chọn xem terminal CLI chuẩn .\mes.ps1 trace) */}
          {traceData.rawCliOutput && (
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg font-mono text-xs">
              <div className="p-3 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-slate-300">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-slate-200">Terminal CLI Output (.\mes.ps1 trace &apos;{traceData.target}&apos;)</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(traceData.rawCliOutput || '');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition"
                  title="Copy toàn bộ output CLI"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Log</span>
                </button>
              </div>
              <pre className="p-4 text-slate-300 overflow-x-auto text-[11px] leading-relaxed max-h-80">
                {traceData.rawCliOutput}
              </pre>
            </div>
          )}
        </div>
      ) : !loading ? (
        <EmptyStateCard
          icon={Layers}
          title="Chẩn Đoán Vòng Đời Lot & PO 360°"
          description="Nhập mã Lot sản xuất hoặc PO vào ô tìm kiếm ở trên để truy vết toàn diện 360° (Single Round-Trip) qua CSDL MES và Kiosk POP."
          samples={[
            { label: 'Lot HY (Model 357)', value: 'VVQR223R072786' },
            { label: 'Lot BG (Model 252)', value: 'VVQR253R018601' },
            { label: 'Lệnh SX (PO)', value: '260828000020' }
          ]}
          onSelectSample={(val) => handleSearch(val)}
        />
      ) : null)}

      {/* SUBTAB 2: LINEAGE 360° HUYẾT MẠCH */}
      {subTab === 'lineage' && (lineageData ? (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                  <GitFork className="w-4 h-4" />
                  Truy Vết Huyết Mạch 3 Trụ Cột (End-to-End Supply Chain Lineage)
                </span>
                <h3 className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white mt-1">
                  {lineageData.target}
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  PO: <b>{lineageData.poCode}</b>
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                  Model: <b>{lineageData.modelCode}</b>
                </span>
              </div>
            </div>
          </div>

          {/* 4 Pipeline Stages */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {lineageData.stages.map((stage, idx) => (
              <div
                key={stage.stageId}
                className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono text-xs font-bold flex items-center justify-center border border-cyan-300 dark:border-cyan-800">
                      {idx + 1}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      stage.status === 'COMPLETED'
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    }`}>
                      {stage.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {stage.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {stage.description}
                  </p>

                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] font-mono">
                    {Object.entries(stage.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                        <span className="font-sans text-slate-500 text-[10px] truncate max-w-[120px]">{k}:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[130px]">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-mono pt-2 border-t border-slate-100 dark:border-slate-800">
                  {stage.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : !loading ? (
        <EmptyStateCard
          icon={GitFork}
          title="Truy Vết Huyết Mạch 4 Trụ Cột (Supply Chain Lineage)"
          description="Nhập mã Lot hoặc PO 12 số để mở sơ đồ phả hệ liên hệ thống (Kế hoạch PO Groupware/ERP ➔ Cấp phát kho NVL ➔ Vòng đời MES WinForm ➔ Kiosk POP xưởng)."
          samples={[
            { label: 'Lot HY', value: 'VVQR223R072786' },
            { label: 'Lệnh PO', value: '260828000020' }
          ]}
          onSelectSample={(val) => handleSearch(val)}
        />
      ) : null)}

      {/* SUBTAB 3: LOCKS REAL-TIME */}
      {subTab === 'locks' && locksData && (
        <div className="space-y-6 animate-fade-in">
          {/* Lock Banner */}
          <div className="bg-white dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                Giám Sát Khóa Blocking & Deadlock Thời Gian Thực
              </span>
              <div className="flex items-center gap-3 mt-1.5">
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">CSDL: {locksData.profile}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  locksData.blockingChainsCount > 0
                    ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800 animate-pulse'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                }`}>
                  {locksData.blockingChainsCount > 0 ? `CẢNH BÁO: ${locksData.blockingChainsCount} Khóa Chặn` : 'Hệ Thống Thông Suốt (0 Khóa Chặn)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Kết Nối Hiện Thời</span>
                <b className="text-slate-900 dark:text-white text-base">{locksData.totalConnections}</b>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <span className="text-slate-400 block text-[10px]">Active Locks</span>
                <b className="text-cyan-600 dark:text-cyan-400 text-base">{locksData.activeLocksCount}</b>
              </div>
            </div>
          </div>

          {/* Active Locks Table */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex justify-between items-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
              <span>Danh Sách Tiến Trình & Khóa DB Đang Giữ</span>
              <span className="text-slate-400 font-mono text-[11px]">Cập nhật: {new Date(locksData.timestamp).toLocaleTimeString('vi-VN')}</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3">SPID</th>
                    <th className="p-3">Bị Chặn Bởi</th>
                    <th className="p-3">Thời Gian Đợi</th>
                    <th className="p-3">Wait Type</th>
                    <th className="p-3">Ứng Dụng (Program)</th>
                    <th className="p-3">Máy Trạm (Host)</th>
                    <th className="p-3">Câu Lệnh SQL Đang Thực Thi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {locksData.locks.map((lk) => (
                    <tr key={lk.spid} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3 font-bold text-cyan-600 dark:text-cyan-400">SPID #{lk.spid}</td>
                      <td className="p-3 font-bold text-rose-600 dark:text-rose-400">
                        {lk.blockedBySpid > 0 ? `#${lk.blockedBySpid}` : '-'}
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{lk.waitTimeSeconds}s</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                          {lk.waitType}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-800 dark:text-slate-200">{lk.programName}</td>
                      <td className="p-3 text-slate-500">{lk.hostName}</td>
                      <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-400" title={lk.sqlText}>
                        <code>{lk.sqlText}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: BOM & TỒN KHO */}
      {subTab === 'bom' && (traceData ? (
        <div className="glass-panel rounded-2xl p-6 space-y-4 animate-fade-in shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              Định Mức BOM & Đối Soát Tồn Kho Khả Dụng (ROUTE_VN_WH vs MAIN_VN_WH)
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">Kiểm tra khả năng cấp bù vật tư cho Lot {traceData.target}</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="p-3">Mã Vật Tư</th>
                  <th className="p-3">Tên Vật Tư</th>
                  <th className="p-3 text-right">Định Mức BOM</th>
                  <th className="p-3 text-right">Đã Tiêu Hao</th>
                  <th className="p-3 text-right">Kho Chuyền (ROUTE)</th>
                  <th className="p-3 text-right">Kho Chính (MAIN)</th>
                  <th className="p-3 text-center">Trạng Thái Tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {traceData.bomMaterials?.map(mat => (
                  <tr key={mat.itemCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-3 text-cyan-600 dark:text-cyan-400 font-bold">{mat.itemCode}</td>
                    <td className="p-3 font-sans text-slate-800 dark:text-slate-200 font-medium">{mat.itemName}</td>
                    <td className="p-3 text-right">{mat.bomQty.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-500">{mat.consumedQty.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-900 dark:text-slate-100">{mat.stockRouteWh.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-500">{mat.stockMainWh.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        mat.status === 'sufficient'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                      }`}>
                        {mat.status === 'sufficient' ? 'Đủ Tồn Kho' : 'Thiếu Tồn Kho'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : !loading ? (
        <EmptyStateCard
          icon={Box}
          title="Kiểm Tra BOM NVL & Tồn Kho Khả Dụng"
          description="Nhập mã Lot hoặc PO để soi định mức tiêu hao BOM và kiểm tra tồn kho khả dụng giữa kho chuyền ROUTE_VN_WH và kho chính MAIN_VN_WH."
          samples={[
            { label: 'Lot HY (Model 357)', value: 'VVQR223R072786' },
            { label: 'Lot BG (Model 252)', value: 'VVQR253R018601' },
            { label: 'Lệnh SX (PO)', value: '260828000020' }
          ]}
          onSelectSample={(val) => handleSearch(val)}
        />
      ) : null)}

      {/* SUBTAB 5: PACKING */}
      {subTab === 'pack' && (packData ? (
        <div className="glass-panel rounded-2xl p-6 space-y-4 animate-fade-in shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-500 uppercase font-semibold">Chi Tiết Đóng Thùng Carton (PackingID)</span>
              <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">{packData.packingId}</h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
              {packData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans">Số lượng quy chuẩn / Thực đóng:</span>
              <div className="text-base font-bold text-cyan-600 dark:text-cyan-400 mt-1">{packData.actualQty} / {packData.standardQty} EA</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans">Trạng thái in tem (IsPrintAllow):</span>
              <div className="text-base font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {packData.isPrintAllow ? 'Cho phép in (Allow)' : 'Bị khóa (Lock)'} (Đã in {packData.printCount} lần)
              </div>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <EmptyStateCard
          icon={Tag}
          title="Truy Vết Đóng Thùng Carton & In Tem (PackingID)"
          description="Nhập mã PackingID (PKQS...) hoặc mã Lot để kiểm tra chi tiết quy cách đóng gói, trạng thái in tem IsPrintAllow và tiến độ hoàn thành trên Kiosk POP."
          samples={[
            { label: 'PackingID Thực Tế', value: 'PKQS0101212' },
            { label: 'Lot HY', value: 'VVQR223R072786' }
          ]}
          onSelectSample={(val) => handleSearch(val)}
        />
      ) : null)}

      {/* SUBTAB 6: USER 5-DB */}
      {subTab === 'user' && (userData ? (
        <div className="glass-panel rounded-2xl p-6 space-y-6 animate-fade-in shadow-sm">
          <div>
            <span className="text-xs text-slate-500 uppercase font-semibold">Tra Cứu Nhân Sự & Phân Quyền 5 CSDL</span>
            <div className="flex items-center gap-3 mt-1.5">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{userData.name}</h3>
              <span className="font-mono text-sm px-3 py-1 rounded-xl bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300 font-bold">
                {userData.empNo}
              </span>
              <span className="text-xs text-slate-500">({userData.dept})</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">1. ERP NEOE (MA_USER)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {userData.erpAuth.loginAllowed ? 'Được phép đăng nhập (YN_LOGIN=Y)' : 'Bị khóa'}
              </div>
              <p className="text-[11px] text-slate-500">Lần đăng nhập cuối: {userData.erpAuth.lastLogin}</p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">2. Kiosk POP (VINA_EMP)</span>
                <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div className="text-base font-bold text-slate-900 dark:text-white">
                {userData.popKioskAuth.isAdmin ? 'Admin Kiosk (EMP_ADMIN=Y)' : 'Công Nhân Tiêu Chuẩn'}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Quyền MBTI: {userData.popKioskAuth.mbti}</p>
            </div>

            <div className="p-5 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">3. MES Core (STB_UserInfo)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-base font-bold text-cyan-600 dark:text-cyan-300 font-mono">ID: {userData.mesWinFormAuth.userId}</div>
              <p className="text-[11px] text-slate-500">Phân quyền: {userData.mesWinFormAuth.role}</p>
            </div>
          </div>
        </div>
      ) : !loading ? (
        <EmptyStateCard
          icon={Users}
          title="Tra Cứu Nhân Sự & Phân Quyền 5 CSDL Đồng Bộ"
          description="Nhập mã nhân viên (EmpNo: 8 số) hoặc tài khoản đăng nhập để kiểm tra tính đồng bộ phân quyền trên ERP NEOE, Kiosk POP, MES Core, Groupware và SSO."
          samples={[
            { label: 'Công nhân HY', value: '32605098' },
            { label: 'Công nhân Đóng Thùng', value: '32512040' },
            { label: 'Kỹ sư IT (vanduc)', value: '92603003' }
          ]}
          onSelectSample={(val) => handleSearch(val)}
        />
      ) : null)}
    </div>
  );
}
