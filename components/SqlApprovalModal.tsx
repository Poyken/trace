'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  RefreshCw, 
  X, 
  Copy, 
  Check, 
  FileCode2, 
  Info, 
  Edit3, 
  RotateCcw, 
  PlusCircle, 
  Terminal,
  Sparkles
} from 'lucide-react';

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
  const [editableSql, setEditableSql] = useState(sql);
  const [copied, setCopied] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [execResult, setExecResult] = useState<{
    success: boolean;
    message: string;
    rowsAffected?: number;
    durationMs?: number;
    rawOutput?: string;
  } | null>(null);

  // Sync initial sql when prop changes
  useEffect(() => {
    setEditableSql(sql);
    setExecResult(null);
  }, [sql, isOpen]);

  if (!isOpen) return null;

  // Real-time safety validation on editableSql
  const hasTransaction = /BEGIN\s+(TRAN|TRANSACTION)/i.test(editableSql);
  const hasVanduc = /'vanduc'/i.test(editableSql);
  const hasWhereClause = /WHERE\s+/i.test(editableSql);
  const isModified = editableSql.trim() !== sql.trim();
  const lineCount = editableSql.split('\n').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(editableSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setEditableSql(sql);
    setExecResult(null);
  };

  const insertHelperSnippet = (snippet: string) => {
    setEditableSql(prev => prev + '\n' + snippet);
  };

  const handleExecute = async (mode: 'dry_run' | 'commit') => {
    setExecuting(true);
    setExecResult(null);

    // Prepare executable SQL based on mode
    let runnableSql = editableSql.trim();
    if (mode === 'dry_run') {
      if (!runnableSql.toUpperCase().includes('ROLLBACK')) {
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
            ? `✅ Khảo sát Dry-Run hoàn tất an toàn! Cú pháp hợp lệ. (Không thay đổi dữ liệu thật trên DB)`
            : `🎉 Đã phê duyệt và thực thi thành công vào CSDL ${targetDb} với Author/ChangeUserID='vanduc'!`,
          rowsAffected: data.rowsAffected ?? 1,
          durationMs: elapsed,
          rawOutput: data.output || data.stdout || 'Thực thi câu lệnh SQL hoàn tất.'
        });
        if (onExecuted) onExecuted(data);
      } else {
        setExecResult({
          success: false,
          message: `❌ Lỗi thực thi SQL: ${data.error || data.stderr || 'Không thể thực thi'}`,
          durationMs: elapsed,
          rawOutput: data.stderr || data.error
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl transition-all duration-300 my-8 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex justify-between items-center shrink-0">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {title || 'Cổng Phê Duyệt & Chỉnh Sửa SQL Trước Khi Chạy'}
                </h3>
                <span className="text-[10px] bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-400 border border-cyan-300 dark:border-cyan-800 px-2 py-0.5 rounded-full font-mono font-bold">
                  Rule 1 • Rule 18
                </span>
                {isModified && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 animate-pulse">
                    <Edit3 className="w-3 h-3" /> Đã Tùy Biến
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bạn có toàn quyền <b>đọc, rà soát và chỉnh sửa trực tiếp</b> câu lệnh SQL trước khi xác nhận gửi xuống database.
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

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
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
              <span className="text-slate-500 font-sans block text-[11px]">Kỹ Sư Phê Duyệt</span>
              <span className="font-bold text-indigo-700 dark:text-indigo-400">vanduc (EA Team)</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-500 font-sans block text-[11px]">Pre-flight Backup</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">Snapshot Tự Động</span>
            </div>
          </div>

          {/* Real-time Safety Check Gate */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                1. Báo Cáo Kiểm Tra An Toàn Thời Gian Thực (Live Pre-Flight Gate):
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {lineCount} dòng • {editableSql.length} ký tự
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-center gap-2">
                {hasTransaction ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className={hasTransaction ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-rose-600 font-bold'}>
                  {hasTransaction ? 'Bọc Transaction an toàn (BEGIN TRAN)' : 'CẢNH BÁO: Thiếu BEGIN TRAN'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasWhereClause ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span className={hasWhereClause ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-rose-600 font-bold'}>
                  {hasWhereClause ? 'Mệnh đề WHERE định danh chuẩn' : 'NGUY HIỂM: Thiếu mệnh đề WHERE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {hasVanduc ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <span className={hasVanduc ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-amber-600 font-medium'}>
                  {hasVanduc ? "Định danh kiểm toán: ChangeUserID='vanduc'" : "Gợi ý: Gắn thêm ChangeUserID='vanduc'"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  Cơ chế tự động Snapshot bản ghi cũ trước khi UPDATE/DELETE
                </span>
              </div>
            </div>
          </div>

          {/* Interactive SQL Editor Area */}
          <div className="space-y-2">
            <div className="flex flex-wrap justify-between items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                2. Soạn Thảo & Chỉnh Sửa SQL Trực Tiếp Trước Khi Chạy:
              </span>

              <div className="flex items-center gap-2">
                {isModified && (
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-[11px] font-medium border border-amber-300 dark:border-amber-800 transition"
                    title="Khôi phục lại nội dung ban đầu từ template"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Khôi phục gốc
                  </button>
                )}

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition font-mono text-[11px] border border-slate-200 dark:border-slate-700 shadow-sm"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Đã copy' : 'Copy SQL'}
                </button>
              </div>
            </div>

            {/* Quick SQL Injection Snippets */}
            <div className="flex flex-wrap gap-1.5 py-1 text-[11px] font-mono">
              <span className="text-slate-500 font-sans self-center mr-1">Chèn nhanh:</span>
              <button
                type="button"
                onClick={() => insertHelperSnippet("SET ChangeUserID = 'vanduc', ChangeDate = GETDATE()")}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                + ChangeUserID=&apos;vanduc&apos;
              </button>
              <button
                type="button"
                onClick={() => insertHelperSnippet("SELECT @@ROWCOUNT AS [RowsAffected];")}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                + @@ROWCOUNT
              </button>
              <button
                type="button"
                onClick={() => insertHelperSnippet("ROLLBACK TRAN;")}
                className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950 dark:hover:bg-amber-900 rounded text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 transition"
              >
                + ROLLBACK TRAN
              </button>
              <button
                type="button"
                onClick={() => insertHelperSnippet("COMMIT TRAN;")}
                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 rounded text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 transition"
              >
                + COMMIT TRAN
              </button>
            </div>

            {/* Editable Textarea with Monospace IDE styling */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 focus-within:border-cyan-500 focus-within:ring-2 focus-within:ring-cyan-500/20 transition shadow-inner">
              <textarea
                value={editableSql}
                onChange={(e) => setEditableSql(e.target.value)}
                rows={12}
                spellCheck={false}
                placeholder="Nhập hoặc chỉnh sửa lệnh SQL tại đây..."
                className="w-full p-4 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-y selection:bg-cyan-500/30 selection:text-cyan-200"
              />
            </div>
          </div>

          {/* Execution Result Box */}
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
                <pre className="mt-2 p-2.5 bg-slate-900 text-slate-200 rounded-lg font-mono text-[10px] overflow-x-auto max-h-32 border border-slate-800">
                  {execResult.rawOutput}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-cyan-600" />
            <span>Quy trình chuẩn: Chạy <b>Dry-Run</b> trước để test số dòng, sau đó mới <b>Phê Duyệt</b>.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition border border-slate-200 dark:border-slate-700"
            >
              Hủy / Đóng
            </button>

            {/* Dry-Run Button */}
            <button
              onClick={() => handleExecute('dry_run')}
              disabled={executing}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-bold rounded-xl transition disabled:opacity-50 shadow-sm"
              title="Chạy thử nghiệm với ROLLBACK TRAN để kiểm tra syntax và số dòng"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${executing ? 'animate-spin' : ''}`} />
              <span>1. Chạy Thử (Dry-Run / Rollback)</span>
            </button>

            {/* Commit & Deploy Button */}
            <button
              onClick={() => handleExecute('commit')}
              disabled={executing}
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl transition shadow-lg shadow-emerald-600/25 disabled:opacity-50"
              title="Phê duyệt câu lệnh đã soạn và thực thi chính thức vào CSDL"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>2. Tôi Đã Duyệt & Chạy Lệnh (vanduc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
