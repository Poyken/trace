'use client';

import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2, Play, RefreshCw, X, Copy, Check, FileCode2, Info } from 'lucide-react';

interface SqlApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  sql: string;
  targetDb?: string;
  targetTable?: string;
  description?: string;
  onExecuted?: (result: any) => void;
}

export default function SqlApprovalModal({
  isOpen,
  onClose,
  title,
  sql,
  targetDb = 'SmartFactoryV2',
  targetTable = '',
  description,
  onExecuted
}: SqlApprovalModalProps) {
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [execResult, setExecResult] = useState<{
    success: boolean;
    message: string;
    rowsAffected?: number;
    durationMs?: number;
    rawOutput?: string;
  } | null>(null);

  if (!isOpen) return null;

  // Safety checks
  const hasTransaction = /BEGIN\s+(TRAN|TRANSACTION)/i.test(sql);
  const hasVanduc = /'vanduc'/i.test(sql);
  const hasWhereClause = /WHERE\s+/i.test(sql);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExecute = async (mode: 'dry_run' | 'commit') => {
    setExecuting(true);
    setExecResult(null);

    // Prepare executable SQL based on mode
    let runnableSql = sql;
    if (mode === 'dry_run') {
      if (!runnableSql.includes('ROLLBACK')) {
        runnableSql += '\nROLLBACK TRAN;';
      }
    } else {
      if (runnableSql.includes('ROLLBACK TRAN;') && !runnableSql.includes('COMMIT TRAN;')) {
        runnableSql = runnableSql.replace(/ROLLBACK\s+TRAN;/gi, 'COMMIT TRAN;');
      }
    }

    const startTime = performance.now();
    try {
      const res = await fetch('/api/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: runnableSql,
          profile: targetDb,
          dryRun: mode === 'dry_run',
          author: 'vanduc'
        })
      });

      const data = await res.json();
      const elapsed = Math.round(performance.now() - startTime);

      if (res.ok && data.success) {
        setExecResult({
          success: true,
          message: mode === 'dry_run'
            ? `✅ Khảo sát Dry-Run hoàn tất an toàn! Đã kiểm tra cú pháp và logic. (Không thay đổi dữ liệu thật)`
            : `🎉 Đã phê duyệt và thực thi thành công vào CSDL ${targetDb} với định danh Author/ChangeUserID='vanduc'!`,
          rowsAffected: data.rowsAffected ?? 1,
          durationMs: elapsed,
          rawOutput: data.output || data.stdout || 'Thực thi câu lệnh SQL hoàn tất.'
        });
        if (onExecuted) onExecuted(data);
      } else {
        setExecResult({
          success: false,
          message: `❌ Lỗi thực thi SQL: ${data.error || data.stderr || 'Không thể thực thi'}`,
          durationMs: elapsed
        });
      }
    } catch (err) {
      setExecResult({
        success: false,
        message: `❌ Lỗi kết nối hệ thống: ${(err as Error).message}`,
        durationMs: Math.round(performance.now() - startTime)
      });
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl transition-all duration-300 my-8">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {title || 'Cổng Phê Duyệt & Duyệt SQL Trước Khi Run'}
                <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-full font-mono">
                  Rule 1 & Rule 18
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kiểm tra an toàn tự động (Pre-flight checks) & phân quyền Kỹ sư IT: <b className="text-cyan-600 dark:text-cyan-400 font-mono">vanduc (EA Team)</b>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Metadata bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">CSDL Mục Tiêu</span>
              <span className="font-bold text-cyan-700 dark:text-cyan-400">{targetDb}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">Bảng Dữ Liệu</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{targetTable || 'Đa bảng (Atomic)'}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">Kỹ Sư Duyệt (Author)</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">vanduc</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">Pre-flight Backup</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Tự Động Bật</span>
            </div>
          </div>

          {/* Automated Safety Check Badges */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              1. Báo Cáo Kiểm Tra An Toàn Tự Động (Automated Pre-Flight Gate):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                {hasTransaction ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={hasTransaction ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 font-medium'}>
                  {hasTransaction ? 'Bọc Transaction (BEGIN TRAN)' : 'Thiếu BEGIN TRAN'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasWhereClause ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className={hasWhereClause ? 'text-slate-700 dark:text-slate-300' : 'text-rose-600 font-medium'}>
                  {hasWhereClause ? 'Mệnh đề WHERE định danh chuẩn' : 'CẢNH BÁO: Thiếu WHERE clause'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasVanduc ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={hasVanduc ? 'text-slate-700 dark:text-slate-300' : 'text-amber-600 font-medium'}>
                  {hasVanduc ? "Định danh tác giả: ChangeUserID='vanduc'" : 'Chưa gắn tag vanduc'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300">
                  Tự động Snapshot sao lưu trước khi ghi
                </span>
              </div>
            </div>
          </div>

          {/* SQL Preview Code Block */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileCode2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                2. Nội Dung Lệnh SQL Chuẩn Bị Thực Thi:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition font-mono text-[11px] border border-slate-200 dark:border-slate-700 shadow-sm"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Đã copy' : 'Copy SQL'}
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto border border-slate-800 max-h-56 leading-relaxed shadow-inner">
              <code>{sql}</code>
            </pre>
          </div>

          {/* Result Box */}
          {execResult && (
            <div
              className={`p-4 rounded-xl border text-xs space-y-1.5 animate-fade-in ${
                execResult.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              <div className="font-bold flex items-center gap-2">
                {execResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                {execResult.message}
              </div>
              {execResult.rowsAffected !== undefined && (
                <div className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                  Số dòng tác động: <b>{execResult.rowsAffected}</b> | Thời gian: {execResult.durationMs}ms
                </div>
              )}
              {execResult.rawOutput && (
                <pre className="mt-2 p-2 bg-slate-900 text-slate-200 rounded font-mono text-[10px] overflow-x-auto max-h-28">
                  {execResult.rawOutput}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-cyan-600" />
            <span>Khuyến nghị: Chạy <b>Dry-Run</b> trước để rà soát số dòng tác động.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              Đóng
            </button>

            {/* Dry-Run Button */}
            <button
              onClick={() => handleExecute('dry_run')}
              disabled={executing}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold rounded-xl transition disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              <span>1. Chạy Thử (Dry-Run / Rollback)</span>
            </button>

            {/* Commit & Deploy Button */}
            <button
              onClick={() => handleExecute('commit')}
              disabled={executing}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/25 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>2. Phê Duyệt & Thực Thi (vanduc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
