'use client';

import React, { useState } from 'react';
import { Cloud, Terminal, CheckCircle2, ShieldCheck, Key, Globe, ExternalLink, RefreshCw } from 'lucide-react';

export default function SettingsTab() {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        setTestResult('✅ Kết nối thành công! API Vercel Serverless đang hoạt động với độ trễ tối ưu.');
      } else {
        setTestResult('⚠️ Không thể phản hồi từ API Health Check.');
      }
    } catch (e) {
      setTestResult('❌ Lỗi kết nối: ' + (e as Error).message);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-300">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          Hướng Dẫn Triển Khai Lên Vercel & Cầu Nối CSDL Nhà Máy
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Cẩm nang hoàn chỉnh để đưa Web Portal lên nền tảng đám mây miễn phí Vercel và duy trì an toàn dữ liệu 100%
        </p>
      </div>

      {/* 3 Step Deployment Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-cyan-100 dark:bg-cyan-950 border border-cyan-300 dark:border-cyan-800 flex items-center justify-center font-bold text-cyan-800 dark:text-cyan-400 text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Đẩy Code Lên GitHub</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Khởi tạo một GitHub repository (riêng tư - Private Repo) từ thư mục <code className="text-cyan-700 dark:text-cyan-400 font-mono">MES_POP/web</code>.
          </p>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-200 shadow-inner">
            git init<br />
            git add .<br />
            git commit -m &quot;Vinatech MES Web Portal&quot;<br />
            git push origin main
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 border border-indigo-300 dark:border-indigo-800 flex items-center justify-center font-bold text-indigo-800 dark:text-indigo-400 text-sm">
            2
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Import Dự Án Vào Vercel</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Đăng nhập vào <span className="text-indigo-600 dark:text-indigo-400 font-semibold">vercel.com</span> (gói Miễn Phí Hobby), chọn <b>Add New Project</b> và chọn repo GitHub vừa tạo.
          </p>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div>• Framework Preset: <b>Next.js</b></div>
            <div>• Root Directory: <b>./</b></div>
            <div>• Node.js Version: <b>20.x hoặc 22.x</b></div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-400 text-sm">
            3
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cấu Hình Biến Môi Trường</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Trong mục <b>Environment Variables</b> trên Vercel, thiết lập các khóa kết nối bảo mật để kích hoạt đầy đủ tính năng:
          </p>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-emerald-400 space-y-1 shadow-inner">
            <div>GEMINI_API_KEY=...</div>
            <div>MES_RELAY_URL=...</div>
            <div>MES_RELAY_SECRET=...</div>
          </div>
        </div>
      </div>

      {/* Hybrid Cloudflare Tunnel Architecture */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Giải Pháp Kết Nối An Toàn Doanh Nghiệp (Cloudflare Tunnel - Free)
        </h3>
        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Để Vercel truy vấn được dữ liệu trực tiếp từ máy chủ nội bộ mà <b>không cần mở cổng Firewall hay IP Public</b>, anh chỉ cần chạy script cầu nối nội bộ:
        </p>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 shadow-inner">
          <div className="text-slate-400"># 1. Chạy API Relay siêu nhẹ tại máy tính xưởng:</div>
          <div className="text-cyan-400">python tools/api_relay.py</div>
          <div className="text-slate-400 pt-2"># 2. Mở đường hầm mã hóa bảo mật (Zero-Trust):</div>
          <div className="text-emerald-400">tools/cloudflared.exe tunnel --url http://127.0.0.1:5000</div>
          <div className="text-slate-400 pt-2">
            ➔ Copy URL sinh ra từ Cloudflare gán vào biến <b>MES_RELAY_URL</b> trên Vercel.
          </div>
        </div>
      </div>

      {/* Git & Vercel Deployment Status */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Trạng Thái Kho Mã Nguồn & Tự Động Deploy Lên Vercel
          </h3>
          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-mono">
            CI/CD Ready
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] font-sans">GitHub Remote</span>
            <b className="text-cyan-600 dark:text-cyan-400 truncate block">Poyken/trace.git</b>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] font-sans">Nhánh Sản Xuất</span>
            <b className="text-slate-900 dark:text-white block">origin / main</b>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="text-slate-400 block text-[10px] font-sans">Cơ Chế Deploy</span>
            <b className="text-emerald-600 dark:text-emerald-400 block font-sans">Tự động sau khi git push</b>
          </div>
        </div>

        <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
          <div className="text-slate-400 text-[11px]"># Lệnh 1 dòng đẩy toàn bộ nâng cấp mới lên GitHub để Vercel tự build:</div>
          <div className="text-emerald-400 font-bold select-all">git add . && git commit -m &quot;feat: complete operations web portal with quick-actions and weekly-report&quot; && git push origin main</div>
        </div>
      </div>

      {/* Connection Test Panel */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">Kiểm Tra Hoạt Động API Vercel Serverless</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">Gửi ping test tới endpoint /api/health để xác nhận tính sẵn sàng</p>
        </div>
        <button
          onClick={runTest}
          disabled={testing}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-400 font-medium text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Đang kiểm tra...' : 'Chạy Kiểm Tra Ngay'}
        </button>
      </div>

      {testResult && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 rounded-xl shadow-sm">
          {testResult}
        </div>
      )}
    </div>
  );
}
