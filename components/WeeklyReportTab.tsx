'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar, 
  Filter,
  BarChart3,
  Layers,
  Sparkles
} from 'lucide-react';
import { WeeklyTaskItem } from '@/lib/types';

export default function WeeklyReportTab() {
  const [startDate, setStartDate] = useState('2026-09-28');
  const [endDate, setEndDate] = useState('2026-10-02');
  const [tasks, setTasks] = useState<WeeklyTaskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterSystem, setFilterSystem] = useState<string>('ALL');

  // Form for adding new task
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSystem, setNewSystem] = useState<'POP' | 'MES' | 'GW' | 'ECM' | 'HW'>('POP');
  const [newLot, setNewLot] = useState('VVQR232R710618');
  const [newRootCause, setNewRootCause] = useState('');
  const [newResolution, setNewResolution] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-report?startDate=${startDate}&endDate=${endDate}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  // Statistics
  const total = tasks.length;
  const popCount = tasks.filter(t => t.system === 'POP').length;
  const mesCount = tasks.filter(t => t.system === 'MES').length;
  const gwCount = tasks.filter(t => t.system === 'GW').length;
  const ecmHwCount = tasks.filter(t => t.system === 'ECM' || t.system === 'HW').length;

  const filteredTasks = filterSystem === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.system === filterSystem);

  const handleAddTask = () => {
    setValidationError(null);
    if (!newTitle.trim()) {
      setValidationError('Vui lòng nhập tiêu đề công việc.');
      return;
    }

    // Rule 22 Validation Check: Kiosk / POP / MongoToMesPerformance must be categorized as POP
    const popKeywords = ['KIOSK', 'POP', 'MONGOTOMESPERFORMANCE', 'VINA_EQUIPMENT_MAPPING', 'NẠP NVL', 'ĐỔI MÁY', 'ACTIVE'];
    const textToCheck = `${newTitle} ${newRootCause} ${newResolution}`.toUpperCase();
    const isPopRelated = popKeywords.some(kw => textToCheck.includes(kw));

    if (isPopRelated && newSystem === 'MES') {
      setValidationError('⚠️ Vi phạm Quy tắc Rule 22: Sự cố này liên quan đến Kiosk / POP / MongoToMesPerformance! BẮT BUỘC chọn phân loại là POP, TUYỆT ĐỐI KHÔNG chọn MES.');
      return;
    }

    const newTaskItem: WeeklyTaskItem = {
      id: `TASK-0${tasks.length + 1}`,
      title: newTitle.trim(),
      system: newSystem,
      lotOrTarget: newLot.trim(),
      rootCause: newRootCause.trim() || 'Đang rà soát nguyên nhân',
      resolution: newResolution.trim() || 'Đã xử lý và kiểm thử thành công',
      status: 'RESOLVED',
      date: new Date().toISOString().split('T')[0],
      author: 'vanduc'
    };

    setTasks(prev => [newTaskItem, ...prev]);
    setNewTitle('');
    setNewRootCause('');
    setNewResolution('');
    setShowAddForm(false);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Generate Markdown report format
  const generateMarkdownReport = () => {
    let md = `# 📊 BÁO CÁO TUẦN IT (VẬN HÀNH MES & POP) - EA TEAM\n`;
    md += `**Thời gian:** ${startDate} ~ ${endDate} | **Kỹ sư phụ trách:** Nguyen Van Duc (vanduc - EA Team)\n`;
    md += `**Quy chuẩn:** Tuân thủ nghiêm ngặt Rule 22 (Phân loại rõ rệt POP vs MES)\n\n`;
    md += `### 1. Tổng Hợp Số Liệu:\n`;
    md += `- **Tổng số vụ việc đã xử lý:** ${total} sự cố (Tỷ lệ giải quyết: 100%)\n`;
    md += `- **Phân hệ POP (Kiosk, Web POP, MongoToMes):** ${popCount} sự cố (${total > 0 ? Math.round((popCount/total)*100) : 0}%)\n`;
    md += `- **Phân hệ Core MES (WinForm & CSDL):** ${mesCount} sự cố\n`;
    md += `- **Phân hệ Groupware & ERP NEOE:** ${gwCount} sự cố\n\n`;
    md += `### 2. Chi Tiết Các Sự Cố & Nhiệm Vụ Vận Hành:\n\n`;
    md += `| STT | Phân Hệ | Đối Tượng | Nội Dung Sự Cố | Nguyên Nhân Gốc Rễ | Phương Án Khắc Phục | Trạng Thái |\n`;
    md += `| :---: | :---: | :---: | :--- | :--- | :--- | :---: |\n`;
    
    tasks.forEach((t, idx) => {
      md += `| ${idx + 1} | **${t.system}** | \`${t.lotOrTarget || '-'}\` | ${t.title} | ${t.rootCause} | ${t.resolution} | ${t.status} |\n`;
    });

    md += `\n### 3. Kế Hoạch Tuần Tới:\n`;
    md += `- Tiếp tục giám sát pipeline đồng bộ MongoToMesPerformance.\n`;
    md += `- Rà soát toàn bộ khóa ACTIVE trên bảng VINA_EQUIPMENT_MAPPING.\n`;
    md += `- Nâng cấp giao diện Web Operations Portal hỗ trợ OP thao tác chuẩn Rule 20.\n`;

    return md;
  };

  const handleCopyReport = () => {
    const md = generateMarkdownReport();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportFromHistory = () => {
    try {
      const saved = localStorage.getItem('vinatech_hotfix_history');
      if (!saved) {
        alert('Chưa có lịch sử thao tác nào trong phiên này.');
        return;
      }
      const historyList = JSON.parse(saved);
      if (!Array.isArray(historyList) || historyList.length === 0) {
        alert('Lịch sử thao tác đang trống.');
        return;
      }

      let addedCount = 0;
      const importedTasks: WeeklyTaskItem[] = [];

      historyList.forEach((h: any, idx: number) => {
        // Prevent duplicate IDs or titles
        const existing = tasks.find(t => t.title.includes(h.type) && t.lotOrTarget === h.targetLot);
        if (existing) return;

        // Auto classify system by Rule 22
        const popKw = ['KIOSK', 'MÁY', 'UNLOCK', 'COMPLETEROUTE', 'MONGOTOMES', 'SWAP'];
        const isPop = popKw.some(kw => (h.type || '').toUpperCase().includes(kw));

        importedTasks.push({
          id: `TASK-IMP-${Date.now()}-${idx}`,
          title: `Xử lý sự cố: ${h.type} cho Lot ${h.targetLot}`,
          system: isPop ? 'POP' : 'MES',
          lotOrTarget: h.targetLot,
          rootCause: `Thực hiện khắc phục sự cố qua Web Operations Portal (${h.mode})`,
          resolution: h.message || 'Đã thực thi thành công vào CSDL',
          status: 'RESOLVED',
          date: new Date().toISOString().split('T')[0],
          author: h.author || 'vanduc'
        });
        addedCount++;
      });

      if (addedCount > 0) {
        setTasks(prev => [...importedTasks, ...prev]);
        alert(`Đã nạp tự động thành công ${addedCount} nhiệm vụ từ Nhật Ký Thao Tác vào Báo Cáo Tuần!`);
      } else {
        alert('Tất cả các tác vụ trong lịch sử đã có mặt trong báo cáo tuần này.');
      }
    } catch (e) {
      alert('Lỗi nạp lịch sử: ' + (e as Error).message);
    }
  };

  const handleDownloadCsv = () => {
    let csv = '\uFEFF'; // UTF-8 BOM
    csv += 'STT,HeThong,DoiTuong,TieuDe,NguyenNhan,PhuongAnKhacPhuc,TrangThai,Ngay,NguoiXuLy\n';
    tasks.forEach((t, idx) => {
      const escape = (str: string) => `"${(str || '').replace(/"/g, '""')}"`;
      csv += `${idx + 1},${escape(t.system)},${escape(t.lotOrTarget || '')},${escape(t.title)},${escape(t.rootCause)},${escape(t.resolution)},${escape(t.status)},${escape(t.date)},${escape(t.author)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `IT_Weekly_Report_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 text-white shadow-md shadow-cyan-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Báo Cáo Tuần IT Tự Động (IT Weekly Report Hub)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tự động soạn báo cáo tuần theo chuẩn <b>Rule 22</b> (POP vs MES), xuất định dạng Markdown và CSV sẵn sàng gửi cấp quản lý.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleImportFromHistory}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-800 dark:text-amber-300 text-xs font-semibold border border-amber-300 dark:border-amber-800 transition shadow-sm"
            title="Tự động chuyển các sự cố đã xử lý trong tuần từ Nhật ký vào báo cáo"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Nạp Từ Nhật Ký Cấp Cứu</span>
          </button>

          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã Copy Markdown' : 'Copy Báo Cáo'}</span>
          </button>

          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất CSV (Excel)</span>
          </button>
        </div>
      </div>

      {/* Date Range & Quick Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Date Selector Box */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Khoảng Thời Gian Báo Cáo
          </span>
          <div className="space-y-2">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Từ ngày (Thứ 2):</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-medium outline-none focus:border-cyan-500 transition"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Đến ngày (Thứ 6):</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-medium outline-none focus:border-cyan-500 transition"
              />
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex justify-between text-[11px] text-slate-500">
            <span>Kỹ sư phụ trách:</span>
            <b className="font-mono text-cyan-600 dark:text-cyan-400">vanduc</b>
          </div>
        </div>

        {/* POP Metric Card */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">Phân Hệ POP (Kiosk)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 font-mono">
              Rule 22
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white">{popCount} <span className="text-sm font-normal text-slate-400">vụ</span></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Kiosk xưởng, nạp NVL, đổi máy nhầm, mở khóa ACTIVE
            </p>
          </div>
          <div className="text-[11px] text-cyan-600 dark:text-cyan-400 font-mono font-semibold">
            Chiếm {total > 0 ? Math.round((popCount / total) * 100) : 0}% tổng sự cố
          </div>
        </div>

        {/* MES Metric Card */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Core MES (WinForm)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-mono">
              B-Series
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white">{mesCount} <span className="text-sm font-normal text-slate-400">vụ</span></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Chuyển ngày B782, xóa cuộn B552, cấp cứu dung dịch 150kg
            </p>
          </div>
          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-mono font-semibold">
            Chiếm {total > 0 ? Math.round((mesCount / total) * 100) : 0}% tổng sự cố
          </div>
        </div>

        {/* Groupware & Other Metric Card */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Groupware & ERP</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-mono">
              Bizbox / NEOE
            </span>
          </div>
          <div className="my-2">
            <div className="text-3xl font-black text-slate-900 dark:text-white">{gwCount} <span className="text-sm font-normal text-slate-400">vụ</span></div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Đồng bộ tờ trình, duyệt PO, liên kết chứng từ
            </p>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
            Tỷ lệ hoàn thành: 100%
          </div>
        </div>
      </div>

      {/* Task List Header & Actions */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Danh Mục Nhiệm Vụ ({filteredTasks.length})
            </span>
            {/* Filter buttons */}
            <div className="flex items-center gap-1 ml-3 text-xs">
              {['ALL', 'POP', 'MES', 'GW'].map(sys => (
                <button
                  key={sys}
                  onClick={() => setFilterSystem(sys)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                    filterSystem === sys
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {sys}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-50 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 hover:bg-cyan-100 text-xs font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm Sự Cố / Công Việc</span>
          </button>
        </div>

        {/* Add Form Drawer */}
        {showAddForm && (
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-4 animate-fade-in">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                Khai Báo Nhiệm Vụ Xử Lý Sự Cố Mới
              </h4>
              <button onClick={() => setShowAddForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
                Đóng
              </button>
            </div>

            {validationError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{validationError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Tiêu đề công việc:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Đổi máy nhầm Kiosk từ VVMHY120 sang VVMHY130 cho Lot..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Phân hệ (Rule 22 bắt buộc):
                </label>
                <select
                  value={newSystem}
                  onChange={(e) => setNewSystem(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-700 dark:text-cyan-300 outline-none focus:border-cyan-500 transition"
                >
                  <option value="POP">POP (Kiosk xưởng, nạp NVL, MongoToMes)</option>
                  <option value="MES">MES (Core MES WinForm B-series, CSDL)</option>
                  <option value="GW">GW (Groupware Bizbox & ERP NEOE)</option>
                  <option value="ECM">ECM (Tài liệu điện tử)</option>
                  <option value="HW">HW (Hạ tầng thiết bị)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mã Lot / Thiết bị:</label>
                <input
                  type="text"
                  value={newLot}
                  onChange={(e) => setNewLot(e.target.value)}
                  placeholder="VVQR..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nguyên nhân gốc rễ:</label>
                <input
                  type="text"
                  value={newRootCause}
                  onChange={(e) => setNewRootCause(e.target.value)}
                  placeholder="Do công nhân chọn nhầm máy..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-500 transition"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Phương án khắc phục:</label>
                <input
                  type="text"
                  value={newResolution}
                  onChange={(e) => setNewResolution(e.target.value)}
                  placeholder="Chạy script swap-machine cập nhật 2 bảng..."
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-cyan-500 transition"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleAddTask}
                className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm"
              >
                Xác Nhận Thêm
              </button>
            </div>
          </div>
        )}

        {/* Task Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100/90 dark:bg-slate-950/80 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-3 w-16">Phân Hệ</th>
                <th className="p-3 w-32">Đối Tượng</th>
                <th className="p-3">Nội Dung Sự Cố & Tác Vụ</th>
                <th className="p-3 hidden md:table-cell">Nguyên Nhân Gốc Rễ</th>
                <th className="p-3 hidden lg:table-cell">Phương Án Khắc Phục</th>
                <th className="p-3 w-24">Trạng Thái</th>
                <th className="p-3 w-10 text-center">Xóa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border ${
                      t.system === 'POP'
                        ? 'bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border-cyan-300 dark:border-cyan-800'
                        : t.system === 'MES'
                        ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                    }`}>
                      {t.system}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {t.lotOrTarget || '-'}
                  </td>
                  <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                    {t.title}
                  </td>
                  <td className="p-3 text-slate-500 dark:text-slate-400 hidden md:table-cell text-[11px]">
                    {t.rootCause}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 hidden lg:table-cell text-[11px]">
                    {t.resolution}
                  </td>
                  <td className="p-3">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteTask(t.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-rose-500 transition"
                      title="Xóa công việc này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
