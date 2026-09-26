'use client';

import React, { useState } from 'react';
import { Search, Layers, Box, Tag, Users, CheckCircle2, AlertTriangle, Clock, ArrowRight, ShieldCheck, Check, Sparkles } from 'lucide-react';
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
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);

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
        const data = await res.json();
        setTraceData(data);
        setSelectedRouteIdx(data.routeHistory?.length - 1 || 0);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/70 backdrop-blur-md p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
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
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                  active
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input Box */}
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
            className="bg-slate-950/80 border border-slate-800 focus:border-cyan-500 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 font-mono w-full sm:w-72 transition"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-cyan-600/20 transition disabled:opacity-50"
          >
            <Search className="w-3.5 h-3.5" />
            {loading ? 'Đang soi...' : 'Tra cứu'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 text-rose-300 text-sm rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SUBTAB 1: TRACE 360 WITH VISUAL STEPPER */}
      {subTab === 'trace' && traceData && (
        <div className="space-y-6 animate-fade-in">
          {/* Header Lot Summary Card */}
          <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-wrap justify-between items-center gap-6 relative z-10">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Đối Tượng Truy Vết 360° (Single Round-Trip)
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <h3 className="text-2xl font-black font-mono tracking-tight text-white">{traceData.target}</h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 text-xs font-bold tracking-wide">
                    {traceData.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-sans block text-[11px]">Model Sản Phẩm</span>
                  <span className="font-bold text-slate-100">{traceData.modelCode}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-500 font-sans block text-[11px]">Dây Chuyền (Line)</span>
                  <span className="font-bold text-cyan-400">{traceData.line}</span>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 font-sans block text-[11px]">Đóng Thùng / Packing</span>
                  <span className="font-bold text-indigo-400">{traceData.packingInfo?.packingId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* VISUAL INTERACTIVE PROCESS FLOW DIAGRAM */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400" />
                Sơ Đồ Tiến Trình Chuyển Tuyến Công Nghệ (Visual Process Stepper)
              </h4>
              <span className="text-[11px] text-slate-400">Click từng nút để xem thông số chi tiết</span>
            </div>

            {/* Stepper Bar */}
            <div className="relative pt-2 pb-4 overflow-x-auto">
              <div className="flex items-center min-w-[700px] justify-between relative">
                {/* Connecting Line */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-slate-800 z-0">
                  <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 w-full rounded" />
                </div>

                {traceData.routeHistory.map((route, idx) => {
                  const isSelected = selectedRouteIdx === idx;
                  const isLast = idx === traceData.routeHistory.length - 1;
                  return (
                    <div
                      key={route.routeOrder}
                      onClick={() => setSelectedRouteIdx(idx)}
                      className="flex flex-col items-center relative z-10 cursor-pointer group"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-all shadow-lg ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30 scale-110'
                            : isLast
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-400'
                        }`}
                      >
                        {route.routeOrder}
                      </div>
                      <span className="text-xs font-semibold text-slate-200 mt-2 text-center max-w-[110px] truncate">
                        {route.routeName.split(' ')[0]}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400">
                        {route.machineCode}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Route Spotlight Card */}
            {traceData.routeHistory[selectedRouteIdx] && (
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 font-sans">Công đoạn đã chọn:</span>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].routeName}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Thiết bị / Kiosk:</span>
                  <div className="text-sm font-bold text-cyan-400 mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].machineCode}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">Công nhân chốt:</span>
                  <div className="text-sm font-bold text-slate-200 mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].workerId}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-sans">SL Đạt / SL Hỏng:</span>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {traceData.routeHistory[selectedRouteIdx].goodQty.toLocaleString()} / <span className="text-rose-400">{traceData.routeHistory[selectedRouteIdx].ngQty}</span> EA
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Route History Detailed Table */}
          <div className="glass-panel rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-300 uppercase">Chi Tiết Nhật Ký Chốt Sản Lượng (STB_ProdRouteHist)</span>
              <span className="text-[11px] font-mono text-slate-500">Total {traceData.routeHistory.length} routes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                  <tr>
                    <th className="p-3">Thứ tự</th>
                    <th className="p-3">Công đoạn</th>
                    <th className="p-3">Thiết bị</th>
                    <th className="p-3">Công nhân</th>
                    <th className="p-3">Giờ Vào</th>
                    <th className="p-3">Giờ Ra</th>
                    <th className="p-3 text-right">SL Đạt (OK)</th>
                    <th className="p-3 text-right">SL Phế (NG)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {traceData.routeHistory.map((route) => (
                    <tr key={route.routeOrder} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400">#{route.routeOrder}</td>
                      <td className="p-3 font-sans font-medium text-slate-200">{route.routeName}</td>
                      <td className="p-3 text-cyan-400 font-bold">{route.machineCode}</td>
                      <td className="p-3 text-slate-300">{route.workerId}</td>
                      <td className="p-3 text-slate-400">{route.inTime}</td>
                      <td className="p-3 text-slate-400">{route.outTime}</td>
                      <td className="p-3 text-emerald-400 text-right font-bold">{route.goodQty.toLocaleString()}</td>
                      <td className="p-3 text-rose-400 text-right">{route.ngQty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: BOM */}
      {subTab === 'bom' && traceData && (
        <div className="glass-panel rounded-2xl p-6 space-y-4 animate-fade-in">
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
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
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
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {traceData.bomMaterials?.map((mat, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="p-3 text-cyan-400 font-bold">{mat.itemCode}</td>
                    <td className="p-3 font-sans text-slate-200">{mat.itemName}</td>
                    <td className="p-3 text-right text-slate-300">{mat.bomQty}</td>
                    <td className="p-3 text-right text-slate-300">{mat.consumedQty}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">{mat.stockRouteWh.toLocaleString()}</td>
                    <td className="p-3 text-right text-slate-400">{mat.stockMainWh.toLocaleString()}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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

      {/* SUBTAB 3: PACK */}
      {subTab === 'pack' && packData && (
        <div className="glass-panel rounded-2xl p-6 space-y-5 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Thông Tin Đóng Gói & Tem Nhãn (B523)</span>
              <h3 className="text-2xl font-black font-mono text-cyan-300 mt-1">{packData.packingId}</h3>
            </div>
            <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
              packData.status === 'COMPLETED' ? 'bg-emerald-950 border border-emerald-800 text-emerald-400' :
              'bg-amber-950 border border-amber-800 text-amber-400'
            }`}>
              {packData.status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-sans">Mã Box Carton:</span>
              <div className="text-base font-bold text-white mt-1">{packData.boxId}</div>
            </div>
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-sans">Số lượng quy chuẩn / Thực đóng:</span>
              <div className="text-base font-bold text-cyan-400 mt-1">{packData.actualQty} / {packData.standardQty} EA</div>
            </div>
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800">
              <span className="text-slate-500 font-sans">Trạng thái in tem (IsPrintAllow):</span>
              <div className="text-base font-bold text-emerald-400 mt-1">
                {packData.isPrintAllow ? 'Cho phép in (Allow)' : 'Bị khóa (Lock)'} (Đã in {packData.printCount} lần)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: USER 5-DB */}
      {subTab === 'user' && userData && (
        <div className="glass-panel rounded-2xl p-6 space-y-6 animate-fade-in">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Tra Cứu Nhân Sự & Phân Quyền 5 CSDL</span>
              <div className="flex items-center gap-3 mt-1.5">
                <h3 className="text-2xl font-black text-white">{userData.name}</h3>
                <span className="font-mono text-sm px-3 py-1 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-300 font-bold">
                  {userData.empNo}
                </span>
                <span className="text-xs text-slate-400">({userData.dept})</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">1. ERP NEOE (MA_USER)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-white">
                {userData.erpAuth.loginAllowed ? 'Được phép đăng nhập (YN_LOGIN=Y)' : 'Bị khóa'}
              </div>
              <p className="text-[11px] text-slate-500">Lần đăng nhập cuối: {userData.erpAuth.lastLogin}</p>
            </div>

            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">2. Kiosk POP (VINA_EMP)</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-base font-bold text-white">
                {userData.popKioskAuth.isAdmin ? 'Admin Kiosk (EMP_ADMIN=Y)' : 'Công Nhân Tiêu Chuẩn'}
              </div>
              <p className="text-[11px] text-slate-500 font-mono">Quyền Hệ Thống: {userData.popKioskAuth.mbti}</p>
            </div>

            <div className="p-5 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-slate-400">3. MES Core (STB_UserInfo)</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-cyan-300 font-mono">ID: {userData.mesWinFormAuth.userId}</div>
              <p className="text-[11px] text-slate-500">Phân quyền: {userData.mesWinFormAuth.role}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
