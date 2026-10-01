'use client';

import React, { useEffect } from 'react';
import { AlertOctagon, RefreshCw, Home, ShieldAlert } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Vinatech MES Operations Portal Error Caught:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 selection:bg-cyan-500/30 selection:text-cyan-200">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-fade-in relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-950/80 border border-rose-800/80 flex items-center justify-center text-rose-400 shadow-lg shadow-rose-950/40">
          <AlertOctagon className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white tracking-tight">
            Khôi Phục Trạng Thái Hoạt Động
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Hệ thống vừa phát hiện sự gián đoạn kết nối hoặc xung đột bộ nhớ đệm (Cache/Hydration). Vui lòng nhấn nút thử lại để tải lại giao diện an toàn.
          </p>
        </div>

        {error?.message && (
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-left font-mono text-[11px] text-rose-300 break-all max-h-28 overflow-y-auto">
            <span className="text-slate-500 font-bold block mb-1">Mã lỗi (Digest: {error.digest || 'N/A'}):</span>
            {error.message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 transition active:scale-[0.98]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại ngay</span>
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition active:scale-[0.98]"
          >
            <Home className="w-4 h-4" />
            <span>Tải lại trang</span>
          </button>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-500" />
          <span>Vinatech MES Operations Copilot • EA Team</span>
        </div>
      </div>
    </div>
  );
}
