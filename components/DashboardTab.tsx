'use client';

import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, Lock, RefreshCw, Cpu, Database, Unlock } from 'lucide-react';
import { HealthStatus } from '@/lib/types';
import { MOCK_HEALTH_DATA } from '@/lib/knowledge';

export default function DashboardTab() {
  const [health, setHealth] = useState<HealthStatus>(MOCK_HEALTH_DATA);
  const [loading, setLoading] = useState(false);
  const [unlockMessage, setUnlockMessage] = useState<string | null>(null);

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

  const handleUnlockMachine = async (machine: string) => {
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machine })
      });
      if (res.ok) {
        const data = await res.json();
        setUnlockMessage(data.message);
        // Remove from list
        setHealth(prev => ({
          ...prev,
          activeEquipmentLocks: {
            ...prev.activeEquipmentLocks,
            count: Math.max(0, prev.activeEquipmentLocks.count - 1),
            machines: prev.activeEquipmentLocks.machines.filter(m => m !== machine)
          }
        }));
        setTimeout(() => setUnlockMessage(null), 4000);
      }
    } catch (e) {
      setUnlockMessage('Lỗi mở khóa: ' + (e as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            Bảng Giám Sát Thời Gian Thực (Morning Health Check)
          </h2>
          <p className="text-sm text-slate-400">
            Giám sát 15 CSDL, WIP quá 24h, tắc nghẽn Pipeline POP ➔ MES, và thiết bị kẹt ACTIVE
          </p>
        </div>
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          {loading ? 'Đang làm mới...' : 'Làm mới số liệu'}
        </button>
      </div>

      {unlockMessage && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm rounded-lg flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {unlockMessage}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Core DBs */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cơ sở dữ liệu cốt lõi</span>
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white mb-2">5 Profiles</div>
          <div className="space-y-1.5 text-xs">
            {health.coreDbs.slice(0, 3).map((db, idx) => (
              <div key={idx} className="flex justify-between items-center text-slate-300">
                <span className="truncate max-w-[150px]">{db.name.split(' ')[0]}</span>
                <span className="font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/60">
                  {db.latencyMs}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WIP Over 24h */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">WIP Quá 24 Giờ</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-3xl font-bold text-amber-300 mb-1">{health.wipOver24h.count.toLocaleString()}</div>
          <p className="text-xs text-slate-400 mb-2">Lô hàng đang chạy dở dang trên các chuyền</p>
          <div className="text-[11px] text-slate-500 font-mono">Lô lâu nhất: {health.wipOver24h.oldestDate}</div>
        </div>

        {/* POP Sync Pipeline */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Kẹt Đồng Bộ POP ➔ MES</span>
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-3xl font-bold text-white mb-1">{health.popSyncPending.count} Lot</div>
          <p className="text-xs text-slate-400 mb-2">Hoàn thành trên POP nhưng chưa vào MES</p>
          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
            MongoToMesPerformance
          </span>
        </div>

        {/* Active Equipment Locks */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Kẹt ACTIVE Kiosk</span>
            <Lock className="w-5 h-5 text-rose-400" />
          </div>
          <div className="text-3xl font-bold text-rose-300 mb-1">{health.activeEquipmentLocks.count} Thiết bị</div>
          <p className="text-xs text-slate-400 mb-2">Thiết bị đang khóa phiên thao tác</p>
          <span className="inline-block text-[11px] px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800 font-mono">
            STB_MachineRunningStatus
          </span>
        </div>
      </div>

      {/* Active Equipment Management Table */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
          <div>
            <h3 className="text-sm font-semibold text-white">Danh Sách Thiết Bị Kiosk POP Đang Giữ Khóa (ACTIVE)</h3>
            <p className="text-xs text-slate-400">Có thể mở khóa giải phóng tức thì 1-Click (ChangeUserID: vanduc)</p>
          </div>
          <span className="text-xs font-mono bg-slate-800 px-2.5 py-1 rounded text-slate-300">
            {health.activeEquipmentLocks.machines.length} máy hiển thị
          </span>
        </div>

        <div className="p-4">
          {health.activeEquipmentLocks.machines.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              Tất cả thiết bị đều đã được giải phóng (IDLE). Không có máy nào bị kẹt phiên!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {health.activeEquipmentLocks.machines.map(machine => (
                <div
                  key={machine}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 hover:border-slate-700"
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="font-mono text-sm font-bold text-slate-200">{machine}</span>
                  </div>
                  <button
                    onClick={() => handleUnlockMachine(machine)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium rounded transition shadow-sm shadow-cyan-600/20"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    Mở khóa
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
