'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Database,
  Play,
  Copy,
  Check,
  Download,
  Search,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Clock,
  Table as TableIcon,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  History,
  Sparkles,
  Layers,
  AlertTriangle,
  Code
} from 'lucide-react';

interface QueryResult {
  success?: boolean;
  profile?: string;
  rowCount?: number;
  columns?: string[];
  rows?: Record<string, any>[];
  elapsedMs?: number;
  executionMs?: number;
  error?: string;
  timestamp?: string;
}

interface QueryPreset {
  id: string;
  name: string;
  profile: string;
  description: string;
  sql: string;
}

const DB_PROFILES = [
  { id: 'SmartFactoryV2', name: 'SmartFactoryV2 (MES Core)', desc: 'CSDL Sản Xuất Lõi, Vòng Đời Lot & WinForm B-Series' },
  { id: 'VINATECH_POP', name: 'VINATECH_POP (POP Kiosk)', desc: 'Kiosk Xưởng, Mapping Thiết Bị & MongoToMes' },
  { id: 'SmartFramework', name: 'SmartFramework (Auth & Menu)', desc: 'Phân Quyền, Danh Mục Tài Khoản & Menu WinForm' },
  { id: 'NEOE', name: 'NEOE (ERP NeoE)', desc: 'Kế Hoạch PO, Quản Trị Kho & Định Mức NVL' },
  { id: 'VINATECH_GROUP', name: 'VINATECH_GROUP (Groupware)', desc: 'Bizbox Groupware, Tờ Trình & Phê Duyệt Văn Bản' },
  { id: 'VINATECH_ANDON', name: 'VINATECH_ANDON (Andon)', desc: 'Hệ Thống Giám Sát Cảnh Báo & Sự Cố Dây Chuyền' },
  { id: 'KSOX', name: 'KSOX (Kiểm Kê SOX)', desc: 'Kiểm Kê Kho & Kiểm Soát Nội Bộ' },
  { id: 'SmartFactoryV2_Archive', name: 'SmartFactoryV2_Archive', desc: 'CSDL Lưu Trữ Lịch Sử Sản Xuất' }
];

const PRESETS: QueryPreset[] = [
  {
    id: 'wip_recent',
    name: 'Top 50 WIP Chốt Công Đoạn',
    profile: 'SmartFactoryV2',
    description: 'Truy vấn các lượt chốt sản lượng mới nhất trên dây chuyền',
    sql: `SELECT TOP 50 
    ProdRouteHistNo, PONo, DayPlanNo, MaterialCode, 
    LineCode, RouteCode, WorkerCode, MachineCode, 
    ProdQty, ProdDateTime, CreateDateTime 
FROM STB_ProdRouteHist WITH(NOLOCK) 
ORDER BY CreateDateTime DESC;`
  },
  {
    id: 'pop_locked_machines',
    name: '39 Máy Kiosk Kẹt ACTIVE',
    profile: 'VINATECH_POP',
    description: 'Danh sách thiết bị Kiosk xưởng đang bị giữ khóa ACTIVE',
    sql: `SELECT 
    EQUIPMENT_ID, EQUIPMENT_NAME, MAPPING_STATUS, 
    DAYPLAN_ID, LINE_CODE, CREATED_AT, UPDATED_AT 
FROM VINA_EQUIPMENT_MAPPING WITH(NOLOCK) 
WHERE MAPPING_STATUS = 'ACTIVE' 
ORDER BY CREATED_AT DESC;`
  },
  {
    id: 'pop_sync_stuck',
    name: '37 Lot Kẹt Sync POP -> MES',
    profile: 'VINATECH_POP',
    description: 'Các mẻ sản xuất đã xong trên Kiosk nhưng chưa sang MES lõi',
    sql: `SELECT TOP 50 
    LotNo, DayPlanNo, MachineCode, RouteCode, 
    ProdQty, IsDone, IsTransferred, CreatedAt 
FROM MongoToMesPerformance WITH(NOLOCK) 
WHERE IsDone = 1 AND IsTransferred = 0 
ORDER BY CreatedAt DESC;`
  },
  {
    id: 'hold_lots',
    name: 'Danh Sách Lot Bị HOLD',
    profile: 'SmartFactoryV2',
    description: 'Quét các Lot đang bị chặn không thể đi tiếp công đoạn',
    sql: `SELECT TOP 50 
    LotID, ProductCode, Line, CurRouteOrder, 
    HoldState, HoldReason, HoldUserID, HoldDateTime 
FROM STB_LotMaster WITH(NOLOCK) 
WHERE HoldState = 1 
ORDER BY HoldDateTime DESC;`
  },
  {
    id: 'blocking_locks',
    name: 'Soi Deadlock & Blocking Locks',
    profile: 'SmartFactoryV2',
    description: 'Giám sát tức thì các session đang bị khóa chặn trên CSDL',
    sql: `SELECT 
    r.session_id, r.status, r.blocking_session_id, 
    r.wait_type, r.wait_time, DB_NAME(r.database_id) AS db_name, 
    t.text AS current_sql 
FROM sys.dm_exec_requests r WITH(NOLOCK) 
CROSS APPLY sys.dm_exec_sql_text(r.sql_handle) t 
WHERE r.session_id > 50;`
  },
  {
    id: 'top_tables',
    name: 'Top 10 Bảng Dung Lượng Lớn Nhất',
    profile: 'SmartFactoryV2',
    description: 'Thống kê kích thước và số dòng các bảng dữ liệu lớn nhất',
    sql: `SELECT TOP 10 
    t.NAME AS TableName, 
    p.rows AS RowCounts, 
    CAST(ROUND(((SUM(a.total_pages) * 8) / 1024.00), 2) AS NUMERIC(36, 2)) AS TotalSpaceMB 
FROM sys.tables t WITH(NOLOCK) 
INNER JOIN sys.indexes i WITH(NOLOCK) ON t.OBJECT_ID = i.object_id 
INNER JOIN sys.partitions p WITH(NOLOCK) ON i.object_id = p.OBJECT_ID AND i.index_id = p.index_id 
INNER JOIN sys.allocation_units a WITH(NOLOCK) ON p.partition_id = a.container_id 
WHERE t.is_ms_shipped = 0 
GROUP BY t.Name, p.Rows 
ORDER BY TotalSpaceMB DESC;`
  },
  {
    id: 'find_sp',
    name: 'Tìm Kiếm Stored Procedure',
    profile: 'SmartFactoryV2',
    description: 'Tìm SP theo từ khóa nghiệp vụ trong mã nguồn SQL',
    sql: `SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED, LAST_ALTERED 
FROM INFORMATION_SCHEMA.ROUTINES WITH(NOLOCK) 
WHERE ROUTINE_NAME LIKE '%ProdRoute%' OR ROUTINE_NAME LIKE '%Lot%' 
ORDER BY LAST_ALTERED DESC;`
  },
  {
    id: 'gw_recent_docs',
    name: 'Tờ Trình Groupware Gần Nhất',
    profile: 'VINATECH_GROUP',
    description: 'Tra cứu chứng từ phê duyệt và tờ trình PO Bizbox',
    sql: `SELECT TOP 30 
    doc_id, doc_title, user_name, create_date, doc_status 
FROM teag_appdoc WITH(NOLOCK) 
ORDER BY create_date DESC;`
  }
];

export default function SqlStudioTab() {
  const [selectedProfile, setSelectedProfile] = useState<string>('SmartFactoryV2');
  const [sqlQuery, setSqlQuery] = useState<string>(PRESETS[0].sql);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterText, setFilterText] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ profile: string; sql: string; time: string }>>([]);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('vinatech_sql_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // ignore
    }
  }, []);

  // Save history
  const saveToHistory = (profile: string, sql: string) => {
    try {
      const newEntry = { profile, sql: sql.trim(), time: new Date().toLocaleTimeString('vi-VN') };
      const updated = [newEntry, ...history.filter(h => h.sql !== sql.trim()).slice(0, 14)];
      setHistory(updated);
      localStorage.setItem('vinatech_sql_history', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Execute Query
  const handleExecuteQuery = async (overrideSql?: string, overrideProfile?: string) => {
    const targetSql = (overrideSql ?? sqlQuery).trim();
    const targetProfile = overrideProfile ?? selectedProfile;

    if (!targetSql) {
      setErrorMsg('Vui lòng nhập câu lệnh SQL cần truy vấn.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: targetSql, profile: targetProfile })
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Truy vấn thất bại. Vui lòng kiểm tra cú pháp SQL.');
        setQueryResult(null);
      } else {
        setQueryResult(data);
        saveToHistory(targetProfile, targetSql);
        setPage(1);
      }
    } catch (err: any) {
      setErrorMsg(`Lỗi kết nối CSDL hoặc Relay: ${err.message}`);
      setQueryResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut Ctrl + Enter inside editor
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecuteQuery();
    }
  };

  // Format / Inject WITH(NOLOCK)
  const handleAddNoLock = () => {
    let updated = sqlQuery;
    // Replace "FROM <Table>" with "FROM <Table> WITH(NOLOCK)" if missing
    updated = updated.replace(/\bFROM\s+([A-Za-z0-9_#]+)(?!\s+WITH\s*\(NOLOCK\))/gi, 'FROM $1 WITH(NOLOCK)');
    updated = updated.replace(/\bJOIN\s+([A-Za-z0-9_#]+)(?!\s+WITH\s*\(NOLOCK\))/gi, 'JOIN $1 WITH(NOLOCK)');
    setSqlQuery(updated);
  };

  // Wrap in Safe Transaction (Rule 1 compliance)
  const handleWrapTransaction = () => {
    const trimmed = sqlQuery.trim();
    if (trimmed.toUpperCase().includes('BEGIN TRAN')) return;
    const wrapped = `-- ======================================================================
-- HOTFIX / DML AN TOÀN TUÂN THỦ RULE 1 (SELECT-ONLY ON PRODUCTION)
-- Kỹ Sư Chịu Trách Nhiệm: Nguyen Van Duc (vanduc - EA Team)
-- ======================================================================
BEGIN TRAN;

${trimmed}

-- KIỂM TRA DỮ LIỆU SAU THAO TÁC TRƯỚC KHI QUYẾT ĐỊNH COMMIT
-- ROLLBACK; -- Mặc định an toàn để kiểm thử
-- COMMIT;   -- Chỉ mở khi đã nghiệm thu chính xác 100%`;
    setSqlQuery(wrapped);
  };

  // Copy results as JSON
  const handleCopyJson = () => {
    if (!queryResult?.rows) return;
    navigator.clipboard.writeText(JSON.stringify(queryResult.rows, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export results as CSV
  const handleExportCsv = () => {
    if (!queryResult?.rows || !queryResult?.columns) return;
    const cols = queryResult.columns;
    const csvRows = [
      cols.join(','),
      ...queryResult.rows.map(row =>
        cols.map(c => {
          const val = row[c] ?? '';
          const strVal = String(val).replace(/"/g, '""');
          return `"${strVal}"`;
        }).join(',')
      )
    ];
    const blob = new Blob([csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Vinatech_SQL_${selectedProfile}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered and Sorted Rows
  const processedRows = useMemo(() => {
    if (!queryResult?.rows) return [];
    let rows = [...queryResult.rows];

    // Filter
    if (filterText.trim()) {
      const q = filterText.toLowerCase();
      rows = rows.filter(row =>
        Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortConfig) {
      rows.sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (sortConfig.direction === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
    }

    return rows;
  }, [queryResult?.rows, filterText, sortConfig]);

  // Paginated Rows
  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, page, pageSize]);

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (current?.key === key) {
        if (current.direction === 'asc') return { key, direction: 'desc' };
        return null;
      }
      return { key, direction: 'asc' };
    });
  };

  // Line count for editor
  const lineCount = (sqlQuery.match(/\n/g) || []).length + 1;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/30">
              <Database className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-bold tracking-tight">SQL Studio • Interactive Query Console</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 font-mono">
                  Multi-DB Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Truy vấn dữ liệu chủ động trên 15 CSDL hệ sinh thái Vinatech • Tự động bọc NOLOCK & An Toàn Rule 1
              </p>
            </div>
          </div>

          {/* Quick DB Profile Switcher & Shortcut indicator */}
          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block font-mono">Phím tắt thực thi</span>
              <kbd className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-800 text-cyan-300 px-2.5 py-1 rounded border border-slate-700">
                Ctrl + Enter
              </kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Library Pills */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span>Thư Viện Truy Vấn Nhanh 1-Click (Presets Thường Dùng)</span>
          </div>
          <span className="text-[11px] text-slate-400">Click để nạp ngay vào trình soạn thảo</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {PRESETS.map(preset => {
            const isMatchDb = preset.profile === selectedProfile;
            return (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedProfile(preset.profile);
                  setSqlQuery(preset.sql);
                }}
                className={`text-left p-2.5 rounded-xl border transition-all text-xs group ${
                  isMatchDb
                    ? 'border-cyan-500/40 bg-cyan-50/50 dark:bg-cyan-950/20 hover:border-cyan-500'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                  <span className="truncate">{preset.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0 ml-1">
                    {preset.profile.replace('VINATECH_', '')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-1">
                  {preset.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Editor & Control Panel */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        {/* Editor Toolbar */}
        <div className="bg-slate-100 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Target DB Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              Cơ sở dữ liệu:
            </span>
            <select
              value={selectedProfile}
              onChange={e => setSelectedProfile(e.target.value)}
              className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 shadow-sm"
            >
              {DB_PROFILES.map(db => (
                <option key={db.id} value={db.id}>
                  {db.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleAddNoLock}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
              title="Tự động thêm WITH(NOLOCK) để chống khóa bảng"
            >
              <Code className="w-3.5 h-3.5 text-cyan-500" />
              <span>Thêm NOLOCK</span>
            </button>

            <button
              onClick={handleWrapTransaction}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
              title="Bọc mã trong BEGIN TRAN ... ROLLBACK an toàn theo Rule 1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Bọc Transaction</span>
            </button>

            <button
              onClick={() => setSqlQuery('')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
              title="Xóa trắng câu lệnh"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>

            {/* Execute Button */}
            <button
              onClick={() => handleExecuteQuery()}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-600/25 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Đang thực thi...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Chạy SQL (Ctrl + Enter)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Editor Body */}
        <div className="relative flex bg-slate-950 font-mono text-sm leading-relaxed border-b border-slate-200 dark:border-slate-800">
          {/* Line Numbers */}
          <div className="w-12 py-3 bg-slate-900/60 text-slate-600 text-right pr-3 select-none text-xs border-r border-slate-800">
            {Array.from({ length: lineCount }).map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            ref={textareaRef}
            value={sqlQuery}
            onChange={e => setSqlQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Nhập câu lệnh SELECT, Stored Procedure hoặc câu lệnh SQL cần tra cứu..."
            rows={Math.max(6, Math.min(lineCount, 16))}
            spellCheck={false}
            className="flex-1 p-3 bg-transparent text-slate-100 placeholder-slate-600 focus:outline-none resize-y min-h-[140px] text-xs font-mono"
          />
        </div>

        {/* Security Rule 1 Banner */}
        <div className="px-4 py-2 bg-amber-500/10 border-t border-amber-500/20 text-[11px] text-amber-600 dark:text-amber-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>
              <strong>Rule 1 (An Toàn CSDL):</strong> Production là SELECT-Only. Lệnh sửa đổi (UPDATE/DELETE) bắt buộc bọc trong{' '}
              <code className="px-1 py-0.5 rounded bg-amber-500/20 font-bold font-mono">BEGIN TRAN ... ROLLBACK</code> với ChangeUserID='vanduc'.
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono hidden md:inline">Profile: {selectedProfile}</span>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-3 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1">
            <span className="font-bold block">Thông báo lỗi thực thi CSDL:</span>
            <pre className="mt-1 font-mono text-[11px] whitespace-pre-wrap text-rose-700 dark:text-rose-300">
              {errorMsg}
            </pre>
          </div>
        </div>
      )}

      {/* Query Results Section */}
      {queryResult && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          {/* Results Toolbar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-950/60">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <TableIcon className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Kết Quả Truy Vấn ({queryResult.profile || selectedProfile})
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-500">
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                  {processedRows.length} dòng {filterText ? `(từ ${queryResult.rowCount || queryResult.rows?.length})` : ''}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-cyan-500" />
                  {queryResult.executionMs || queryResult.elapsedMs || 12} ms
                </span>
              </div>
            </div>

            {/* Table Search & Export */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Lọc kết quả..."
                  value={filterText}
                  onChange={e => {
                    setFilterText(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8 pr-3 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-36 sm:w-48"
                />
              </div>

              <button
                onClick={handleCopyJson}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 shadow-sm"
                title="Sao chép toàn bộ kết quả dưới dạng JSON"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'JSON'}</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 shadow-sm"
                title="Tải kết quả về máy dạng file CSV"
              >
                <Download className="w-3.5 h-3.5 text-cyan-500" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Results Table */}
          <div className="overflow-x-auto max-h-[500px]">
            {paginatedRows.length > 0 ? (
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center text-slate-400 font-mono">#</th>
                    {(queryResult.columns || Object.keys(paginatedRows[0])).map(col => (
                      <th
                        key={col}
                        onClick={() => handleSort(col)}
                        className="py-2.5 px-3 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-900 transition whitespace-nowrap select-none"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span>{col}</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60" />
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {paginatedRows.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className="hover:bg-cyan-500/5 transition-colors group"
                    >
                      <td className="py-2 px-3 text-center text-slate-400 text-[10px] select-none bg-slate-50/50 dark:bg-slate-950/30">
                        {(page - 1) * pageSize + rIdx + 1}
                      </td>
                      {(queryResult.columns || Object.keys(row)).map((col, cIdx) => {
                        const val = row[col];
                        const isNull = val === null || val === undefined;
                        return (
                          <td
                            key={cIdx}
                            className={`py-2 px-3 whitespace-nowrap max-w-xs truncate ${
                              isNull ? 'text-slate-400 italic' : 'text-slate-800 dark:text-slate-200'
                            }`}
                            title={String(val ?? 'NULL')}
                          >
                            {isNull ? 'NULL' : String(val)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                Không tìm thấy dòng dữ liệu nào phù hợp với bộ lọc.
              </div>
            )}
          </div>

          {/* Pagination Footer */}
          {processedRows.length > pageSize && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 bg-slate-50 dark:bg-slate-950/60">
              <div className="flex items-center space-x-2">
                <span>Hiển thị</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs text-slate-700 dark:text-slate-300"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span>dòng / trang</span>
              </div>

              <div className="flex items-center space-x-2">
                <span>
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-1 rounded border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Query History Drawer */}
      {history.length > 0 && (
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 dark:text-slate-300">
              <History className="w-4 h-4 text-indigo-500" />
              <span>Lịch Sử Truy Vấn Gần Đây (Saved History)</span>
            </div>
            <button
              onClick={() => {
                setHistory([]);
                localStorage.removeItem('vinatech_sql_history');
              }}
              className="text-[10px] text-slate-400 hover:text-rose-500 transition"
            >
              Xóa lịch sử
            </button>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {history.map((h, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setSelectedProfile(h.profile);
                  setSqlQuery(h.sql);
                }}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/40 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 border border-slate-200 dark:border-slate-800/80 cursor-pointer text-xs group transition"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0 mr-3">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    {h.profile}
                  </span>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 truncate">
                    {h.sql.replace(/\s+/g, ' ')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">{h.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
