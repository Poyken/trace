'use client';

import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-950/80 border border-amber-800 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-white">Khôi Phục Phiên Hoạt Động Toàn Cục</h2>
          <p className="text-xs text-slate-400">
            Hệ thống gặp sự cố tải mã nguồn. Nhấn nút bên dưới để khôi phục trạng thái ổn định.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Thử lại</span>
          </button>
        </div>
      </body>
    </html>
  );
}
