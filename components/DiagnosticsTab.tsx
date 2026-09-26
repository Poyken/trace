'use client';

import React, { useState } from 'react';
import { Search, Layers, Box, Tag, Users, CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { TraceResult, UserInspectionResult, PackInspectionResult } from '@/lib/types';

interface DiagnosticsTabProps {
  initialType?: string;
  initialTarget?: string;
}

export default function DiagnosticsTab({ initialType = 'trace', initialTarget = '' }: DiagnosticsTabProps) {
  const [subTab, setSubTab] = useState<'trace' | 'bom' | 'pack' | 'user'>(
    (initialType as 'trace' | 'bom' | 'pack' | 'user') || 'trace'
  );
  const [query, setQuery] = useState(initialTarget || 'VVQR232R710618');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Results
  const [traceData, setTraceData] = useState<TraceResult | null>(null);
  const [packData, setPackData] = useState<PackInspectionResult | null>(null);
  const [userData, setUserData] = useState<UserInspectionResult | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      if (subTab === 'trace' || subTab === 'bom') {
        const res = await fetch(`/api/trace?target=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        setTraceData(await res.json());
      } else if (subTab === 'pack') {
        const res = await fetch(`/api/pack?target=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        setPackData(await res.json());
      } else if (subTab === 'user') {
        const res = await fetch(`/api/user?target=${encodeURIComponent(query.trim())}`);
        if (!res.ok) throw new Error((await res.json()).error || 'Lỗi truy vấn');
        setUserData(await res.json());
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-tab selection bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="flex space-x-2">
          {[
            { id: 'trace', label: 'Trace 360° (Lot & PO)', icon: Layers },
            { id: 'bom', label: 'BOM NVL & Tồn Kho', icon: Box },
            { id: 'pack', label: 'Đóng Thùng & PackingID', icon: Tag },
            { id: 'user', label: 'Nhân Sự & Quyền (5 DBs)', icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setSubTab(tab.id as 'trace' | 'bom' | 'pack' | 'user');
                  setError(null);
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

        {/* Input box */}
        <div className="flex w-full sm:w-auto items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={
              subTab === 'user' ? 'Nhập mã NV (92603003)...' :
              subTab === 'pack' ? 'Nhập mã PKQR... hoặc Lot...' :
              'Nhập mã Lot (VVQR...) hoặc PO...'
            }
            className="bg-slate-950 border border-slate-800 focus:border-cyan-500 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 font-mono w-64"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs rounded-lg border border-slate-700 transition"
          >
            <Search className="w-3.5 h-3.5" />
            {loading ? 'Đang soi...' : 'Tra cứu'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-950/60 border border-rose-800 text-rose-300 text-sm rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          {error}
        </div>
      )}

      {/* Subtab 1: Trace 360 */}
      {subTab === 'trace' && traceData && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Lot info card */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Đối Tượng Truy Vết 360°</span>
                <div className="flex items-center gap-3 mt-1">
                  <h3 className="text-xl font-bold font-mono text-cyan-300">{traceData.target}</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-semibold">
                    {traceData.status}
                  </span>
                </div>
              </div>
              <div className="text-right text-xs space-y-1">
                <div className="text-slate-400">Model: <span className="font-semibold text-white">{traceData.modelCode}</span> ({traceData.modelName})</div>
                <div className="text-slate-400">Chuyền sản xuất: <span className="font-semibold text-white">{traceData.line}</span></div>
                <div className="text-slate-400">Công đoạn hiện tại: <span className="font-semibold text-cyan-400">{traceData.currentRoute}</span></div>
              </div>
            </div>
          </div>

          {/* Route History Timeline */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Tiến Trình Chuyển Công Đoạn (Route History)
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-2.5 font-semibold">Thứ tự</th>
                    <th className="p-2.5 font-semibold">Công đoạn</th>
                    <th className="p-2.5 font-semibold">Thiết bị</th>
                    <th className="p-2.5 font-semibold">Công nhân</th>
                    <th className="p-2.5 font-semibold">Giờ Vào</th>
                    <th className="p-2.5 font-semibold">Giờ Ra</th>
                    <th className="p-2.5 font-semibold text-right">SL Đạt (OK)</th>
                    <th className="p-2.5 font-semibold text-right">SL Phế (NG)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {traceData.routeHistory.map((route) => (
                    <tr key={route.routeOrder} className="hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-400">#{route.routeOrder}</td>
                      <td className="p-2.5 font-sans font-medium text-slate-200">{route.routeName}</td>
                      <td className="p-2.5 text-cyan-400">{route.machineCode}</td>
                      <td className="p-2.5 text-slate-300">{route.workerId}</td>
                      <td className="p-2.5 text-slate-400">{route.inTime}</td>
                      <td className="p-2.5 text-slate-400">{route.outTime}</td>
                      <td className="p-2.5 text-emerald-400 text-right font-bold">{route.goodQty.toLocaleString()}</td>
                      <td className="p-2.5 text-rose-400 text-right">{route.ngQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: BOM */}
      {subTab === 'bom' && traceData && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Box className="w-4 h-4 text-cyan-400" />
                Định Mức BOM & Đối Soát Tồn Kho Khả Dụng (ROUTE_VN_WH vs MAIN_VN_WH)
              </h4>
              <p className="text-xs text-slate-400">Kiểm tra khả năng cấp bù vật tư cho Lot {traceData.target}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-2.5 font-semibold">Mã Vật Tư</th>
                  <th className="p-2.5 font-semibold">Tên Vật Tư</th>
                  <th className="p-2.5 font-semibold text-right">Định Mức BOM</th>
                  <th className="p-2.5 font-semibold text-right">Đã Tiêu Hao</th>
                  <th className="p-2.5 font-semibold text-right">Kho Chuyền (ROUTE)</th>
                  <th className="p-2.5 font-semibold text-right">Kho Chính (MAIN)</th>
                  <th className="p-2.5 font-semibold text-center">Trạng Thái Tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {traceData.bomMaterials?.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30">
                    <td className="p-2.5 text-cyan-400 font-bold">{mat.itemCode}</td>
                    <td className="p-2.5 font-sans text-slate-200">{mat.itemName}</td>
                    <td className="p-2.5 text-right text-slate-300">{mat.bomQty}</td>
                    <td className="p-2.5 text-right text-slate-300">{mat.consumedQty}</td>
                    <td className="p-2.5 text-right text-emerald-400 font-bold">{mat.stockRouteWh.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-slate-400">{mat.stockMainWh.toLocaleString()}</td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        mat.status === 'sufficient' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                        mat.status === 'low' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                        'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {mat.status === 'sufficient' ? 'Khả dụng tốt' : mat.status === 'low' ? 'Cảnh báo ít' : 'Thiếu hàng'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Pack */}
      {subTab === 'pack' && packData && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Thông Tin Đóng Gói & Tem Nhãn (B523)</span>
              <h3 className="text-xl font-bold font-mono text-cyan-300 mt-1">{packData.packingId}</h3>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              packData.status === 'COMPLETED' ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' :
              'bg-amber-950 border border-amber-800 text-amber-400'
            }`}>
              {packData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans">Mã Box Carton:</span>
              <div className="text-sm font-bold text-white mt-1">{packData.boxId}</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans">Số lượng quy chuẩn / Thực đóng:</span>
              <div className="text-sm font-bold text-cyan-400 mt-1">{packData.actualQty} / {packData.standardQty} EA</div>
            </div>
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <span className="text-slate-500 font-sans">Trạng thái in tem (IsPrintAllow):</span>
              <div className="text-sm font-bold text-emerald-400 mt-1">
                {packData.isPrintAllow ? 'Cho phép in (Allow)' : 'Bị khóa (Lock)'} (Đã in {packData.printCount} lần)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subtab 4: User 5-DB */}
      {subTab === 'user' && userData && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-5 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Tra Cứu Nhân Sự & Phân Quyền 5 CSDL</span>
              <div className="flex items-center gap-3 mt-1">
                <h3 className="text-xl font-bold text-white">{userData.name}</h3>
                <span className="font-mono text-sm px-2.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  {userData.empNo}
                </span>
                <span className="text-xs text-slate-400">({userData.dept})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* ERP NEOE */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">1. ERP NEOE (MA_USER)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-white">
                {userData.erpAuth.loginAllowed ? 'Được phép đăng nhập (YN_LOGIN=Y)' : 'Bị khóa'}
              </div>
              <p className="text-[11px] text-slate-500">Lần đăng nhập cuối: {userData.erpAuth.lastLogin}</p>
            </div>

            {/* POP Kiosk */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">2. Kiosk POP (VINA_EMP)</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-sm font-bold text-white">
                {userData.popKioskAuth.isAdmin ? 'Admin Kiosk (EMP_ADMIN=Y)' : 'Công Nhân Tiêu Chuẩn'}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Quyền Hệ Thống: {userData.popKioskAuth.mbti}</p>
            </div>

            {/* MES WinForm */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">3. MES Core (STB_UserInfo)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-sm font-bold text-cyan-300 font-mono">ID: {userData.mesWinFormAuth.userId}</div>
              <p className="text-[11px] text-slate-500">Phân quyền: {userData.mesWinFormAuth.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
