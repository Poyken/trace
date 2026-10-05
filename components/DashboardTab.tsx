'use client';

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Lock, RefreshCw, Cpu, Database, Code, ChevronDown, ChevronUp } from 'lucide-react';
import { HealthStatus } from '@/lib/types';
import { MOCK_HEALTH_DATA } from '@/lib/knowledge';

export default function DashboardTab() {
  const [health, setHealth] = useState<HealthStatus>(MOCK_HEALTH_DATA);
  const [loading, setLoading] = useState(false);
  const [showSqlInspector, setShowSqlInspector] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setHealth(await res.json());
      }
    } catch {
      // Keep state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            Bảng Giám Sát Thời Gian Thực (Morning Health Check)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Giám sát 15 CSDL, WIP quá 24h, tắc nghẽn Pipeline POP ➔ MES, và thiết bị kẹt ACTIVE
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700 disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
          {loading ? 'Đang làm mới...' : 'Làm mới số liệu'}
        </button>
      </div>



      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core DBs */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cơ sở dữ liệu cốt lõi</span>
            <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mb-2">5 Profiles</div>
          <div className="space-y-1.5 text-xs">
            {health.coreDbs.slice(0, 3).map((db, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                <span className="truncate max-w-[140px] font-medium">{db.name.split(' ')[0]}</span>
                <span className="font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 font-semibold">
                  {db.latencyMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WIP Over 24h */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-amber-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">WIP Quá 24 Giờ</span>
            <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          </div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-300 mb-1">{health.wipOver24h.count.toLocaleString()}</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Lô hàng đang chạy dở dang trên chuyền</p>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate">Lâu nhất: {health.wipOver24h.oldestDate}</div>
        </div>

        {/* POP Sync Pipeline */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-cyan-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Kẹt Đồng Bộ POP ➔ MES</span>
            <Cpu className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">{health.popSyncPending.count} Lot</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Hoàn thành trên POP chưa vào MES</p>
          <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 font-mono font-medium">
            MongoToMesPerformance
          </span>
        </div>

        {/* Active Equipment Locks */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-rose-500/50 transition-all shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Kẹt ACTIVE Kiosk</span>
            <Lock className="w-5 h-5 text-rose-500 dark:text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-300 mb-1">{health.activeEquipmentLocks.count} Thiết bị</div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
            {health.activeEquipmentLocks.orphanCount !== undefined
              ? `${health.activeEquipmentLocks.orphanCount} máy kẹt từ ca cũ (Orphan)`
              : 'Thiết bị đang khóa phiên thao tác'}
          </p>
          <span className="inline-block text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-mono font-medium">
            VINA_EQUIPMENT_MAPPING
          </span>
        </div>
      </div>

      {/* Active Equipment Management Table */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/80 dark:bg-slate-950/40">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Danh Sách Thiết Bị Kiosk POP Đang Giữ Khóa (ACTIVE)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Bảng mục tiêu: <code className="text-cyan-700 dark:text-cyan-400 font-mono font-bold">VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING</code> (ChangeUserID: vanduc)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSqlInspector(!showSqlInspector)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-mono transition"
            >
              <Code className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{showSqlInspector ? 'Ẩn SQL' : 'Soi câu SQL Chạy Ngầm'}</span>
              {showSqlInspector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            <span className="text-xs font-mono bg-slate-200 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 font-bold">
              {health.activeEquipmentLocks.machines.length} máy
            </span>
          </div>
        </div>

        {/* SQL INSPECTOR PANEL (When toggled) */}
        {showSqlInspector && (
          <div className="p-5 bg-slate-900 text-slate-200 border-b border-slate-800 font-mono text-xs space-y-3 animate-fade-in">
            <div className="text-cyan-400 font-bold flex items-center gap-2">
              <span>SQL TRUY VẤN DANH SÁCH MÁY KẸT (KHI MỞ MÀN HÌNH):</span>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 overflow-x-auto text-[11px] text-slate-300">
{`SELECT 
    MAPPING_ID, DAY_PLAN_NO, LINE_CODE, ROUTE_CODE, EQUIPMENT_ID, EQUIPMENT_NAME, 
    MAPPING_STATUS, MAPPED_BY, MAPPED_AT, RELEASED_AT, RELEASE_REASON
FROM VINATECH_POP.dbo.VINA_EQUIPMENT_MAPPING WITH(NOLOCK)
WHERE MAPPING_STATUS IN ('ACTIVE', 'AUTO_MAPPED')
ORDER BY MAPPED_AT DESC;`}
            </pre>
          </div>
        )}

        {/* Equipment Grid */}
        <div className="p-5">
          {health.activeEquipmentLocks.machines.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              Tất cả thiết bị đều đã được giải phóng (RELEASED). Không có máy nào bị kẹt phiên!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {health.activeEquipmentLocks.machines.map((item, idx) => {
                const eqId = typeof item === 'string' ? item : item.equipmentId;
                const eqName = typeof item === 'object' && item.equipmentName ? item.equipmentName : eqId;
                const line = typeof item === 'object' ? item.lineCode : null;
                const route = typeof item === 'object' ? item.routeCode : null;
                const dayPlan = typeof item === 'object' ? item.dayPlanNo : null;
                const mappedAt = typeof item === 'object' ? item.mappedAt : null;
                const isOrphan = typeof item === 'object' ? item.isOrphan : true;

                return (
                  <div
                    key={eqId + '-' + idx}
                    className="flex flex-col justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-all shadow-sm space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span className={`w-2 h-2 rounded-full ${isOrphan ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-100">{eqId}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isOrphan
                            ? 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        }`}>
                          {isOrphan ? 'Kẹt ca cũ' : 'Đang chạy ca'}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-slate-900 dark:text-slate-200 truncate" title={eqName}>
                        {eqName}
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5 font-mono">
                        {line && <div><span className="text-slate-400">Line:</span> {line} {route ? `(${route})` : ''}</div>}
                        {dayPlan && <div><span className="text-slate-400">Kế hoạch:</span> {dayPlan}</div>}
                        {mappedAt && <div><span className="text-slate-400">Khóa lúc:</span> {mappedAt}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
