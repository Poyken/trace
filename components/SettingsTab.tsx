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
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cloud className="w-5 h-5 text-indigo-400" />
          Hướng Dẫn Triển Khai Lên Vercel & Cầu Nối CSDL Nhà Máy
        </h2>
        <p className="text-xs text-slate-400">
          Cẩm nang hoàn chỉnh để đưa Web Portal lên nền tảng đám mây miễn phí Vercel và duy trì an toàn dữ liệu 100%
        </p>
      </div>

      {/* 3 Step Deployment Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Step 1 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center font-bold text-cyan-400 text-sm">
            1
          </div>
          <h3 className="text-sm font-bold text-white">Đẩy Code Lên GitHub</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Khởi tạo một GitHub repository (riêng tư - Private Repo) từ thư mục <code className="text-cyan-400 font-mono">MES_POP/web</code>.
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
            git init<br />
            git add .<br />
            git commit -m &quot;Vinatech MES Web Portal&quot;<br />
            git push origin main
          </div>
        </div>

        {/* Step 2 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-400 text-sm">
            2
          </div>
          <h3 className="text-sm font-bold text-white">Import Dự Án Vào Vercel</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Đăng nhập vào <span className="text-indigo-400 font-semibold">vercel.com</span> (gói Miễn Phí Hobby), chọn <b>Add New Project</b> và chọn repo GitHub vừa tạo.
          </p>
          <div className="text-xs text-slate-500 space-y-1">
            <div>• Framework Preset: <b>Next.js</b></div>
            <div>• Root Directory: <b>./</b></div>
            <div>• Node.js Version: <b>20.x hoặc 22.x</b></div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-800 flex items-center justify-center font-bold text-emerald-400 text-sm">
            3
          </div>
          <h3 className="text-sm font-bold text-white">Cấu Hình Biến Môi Trường</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Trong mục <b>Environment Variables</b> trên Vercel, thiết lập các khóa kết nối bảo mật để kích hoạt đầy đủ tính năng:
          </p>
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-emerald-300 space-y-1">
            <div>GEMINI_API_KEY=...</div>
            <div>MES_RELAY_URL=...</div>
            <div>MES_RELAY_SECRET=...</div>
          </div>
        </div>
      </div>

      {/* Hybrid Cloudflare Tunnel Architecture */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Giải Pháp Kết Nối An Toàn Doanh Nghiệp (Cloudflare Tunnel - Free)
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          Để Vercel truy vấn được dữ liệu trực tiếp từ máy chủ nội bộ mà <b>không cần mở cổng Firewall hay IP Public</b>, anh chỉ cần chạy script cầu nối nội bộ:
        </p>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-slate-500"># 1. Chạy API Relay siêu nhẹ tại máy tính xưởng:</div>
          <div className="text-cyan-400">powershell -ExecutionPolicy Bypass -File .\tools\api_relay.ps1</div>
          <div className="text-slate-500 pt-2"># 2. Mở đường hầm mã hóa bảo mật (Zero-Trust):</div>
          <div className="text-emerald-400">cloudflared tunnel --url http://localhost:5000</div>
          <div className="text-slate-500 pt-2">
            ➔ Copy URL sinh ra từ Cloudflare gán vào biến <b>MES_RELAY_URL</b> trên Vercel.
          </div>
        </div>
      </div>

      {/* Connection Test Panel */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-sm font-bold text-white">Kiểm Tra Hoạt Động API Vercel Serverless</h4>
          <p className="text-xs text-slate-400">Gửi ping test tới endpoint /api/health để xác nhận tính sẵn sàng</p>
        </div>
        <button
          onClick={runTest}
          disabled={testing}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs rounded-xl border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Đang kiểm tra...' : 'Chạy Kiểm Tra Ngay'}
        </button>
      </div>

      {testResult && (
        <div className="p-3 bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 rounded-xl">
          {testResult}
        </div>
      )}
    </div>
  );
}
